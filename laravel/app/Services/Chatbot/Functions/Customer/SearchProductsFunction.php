<?php

namespace App\Services\Chatbot\Functions\Customer;

use App\Services\Chatbot\Functions\ChatFunctionInterface;
use App\Models\Product;
use Illuminate\Support\Facades\Http;

class SearchProductsFunction implements ChatFunctionInterface
{
    public function getName(): string
    {
        return 'searchProducts';
    }

    public function getDescription(): string
    {
        return 'Tìm kiếm sản phẩm trong cửa hàng bằng từ khóa (tên, màu sắc, size, phong cách) hoặc tìm theo khoảng giá. Ví dụ: "áo khoác đen dưới 500k", "váy dự tiệc".';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'keyword' => [
                    'type' => 'string',
                    'description' => 'Từ khóa tìm kiếm (có thể là tên sản phẩm, màu sắc, phong cách, dịp sử dụng).'
                ],
                'max_price' => [
                    'type' => 'number',
                    'description' => 'Mức giá tối đa khách muốn tìm (đơn vị VNĐ).'
                ],
                'limit' => [
                    'type' => 'integer',
                    'description' => 'Số lượng sản phẩm trả về (mặc định 3).'
                ],
                'sort' => [
                    'type' => 'string',
                    'description' => 'Sắp xếp theo: "price_asc" (giá tăng dần - rẻ nhất), "price_desc" (giá giảm dần - đắt nhất).'
                ]
            ],
            'required' => ['keyword']
        ];
    }

    public function execute(array $args): array
    {
        $keyword = $args['keyword'] ?? '';
        $maxPrice = $args['max_price'] ?? null;
        $limit = $args['limit'] ?? 3;

        // 1. Tạo vector từ keyword
        $queryVector = $this->getEmbedding($keyword);
        $products = collect([]);

        // 2. Vector Search nếu có
        if ($queryVector) {
            $allProducts = Product::whereNotNull('embedding')
                ->where('status', 'active')
                ->get(['id', 'embedding']);

            $ranked = $allProducts->map(function ($item) use ($queryVector) {
                $itemVector = json_decode($item->embedding);
                $item->similarity = $this->cosineSimilarity($queryVector, $itemVector);
                return $item;
            })->sortByDesc('similarity');

            $topIds = $ranked->filter(fn($i) => $i->similarity > 0.45)->take($limit * 2)->pluck('id');

            if ($topIds->isNotEmpty()) {
                $query = Product::with([
                    'variants.attributes',
                    'variants.inventories',
                    'category'
                ])->whereIn('id', $topIds);

                if ($maxPrice) {
                    $query->whereHas('variants', function ($q) use ($maxPrice) {
                        $q->where('price', '<=', $maxPrice);
                    });
                }

                $products = $query->get()->sortBy(function($model) use ($topIds) {
                    return array_search($model->id, $topIds->toArray());
                })->take($limit);
            }
        }

        // 3. Fallback LIKE query
        if ($products->isEmpty()) {
            $query = Product::where('products.status', 'active')
                ->where(function($q) use ($keyword) {
                    if ($keyword) {
                        $q->where('products.name', 'like', "%{$keyword}%")
                          ->orWhereHas('variants', function($vq) use ($keyword) {
                              $vq->where('name', 'like', "%{$keyword}%");
                          });
                    }
                })
                ->with(['variants.attributes', 'variants.inventories', 'category']);
                
            if ($maxPrice) {
                $query->whereHas('variants', function ($q) use ($maxPrice) {
                    $q->where('price', '<=', $maxPrice);
                });
            }

            // Xử lý sắp xếp
            $sort = $args['sort'] ?? null;
            if ($sort === 'price_asc') {
                $query->join('product_variants', 'products.id', '=', 'product_variants.product_id')
                      ->select('products.*', 'product_variants.price as sort_price')
                      ->orderBy('product_variants.price', 'asc');
            } elseif ($sort === 'price_desc') {
                $query->join('product_variants', 'products.id', '=', 'product_variants.product_id')
                      ->select('products.*', 'product_variants.price as sort_price')
                      ->orderBy('product_variants.price', 'desc');
            }

            $products = $query->distinct()->take($limit)->get();
        }

        // 4. Format kết quả trả về cho AI
        if ($products->isEmpty()) {
            return ['message' => 'Không tìm thấy sản phẩm nào phù hợp.'];
        }

        $result = [];
        foreach ($products as $p) {
            // Đảm bảo lấy giá từ variants nếu có, tránh n+1
            $minPrice = $p->variants->min('price') ?? 0;
            $result[] = [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'price' => number_format($minPrice, 0, ',', '.'),
                'link' => "/products/{$p->slug}",
                'feature_image' => $p->feature_image,
                'category' => $p->category ? $p->category->name : '',
                'total_sold' => $p->sold_count ?? 0
            ];
        }

        return [
            'message' => 'Tìm thấy các sản phẩm sau:',
            'products' => $result
        ];
    }

    private function getEmbedding($text)
    {
        $useVertex = config('gemini.use_vertex', false);
        $model = config('gemini.embedding_model', 'text-embedding-004'); // Vertex thường dùng text-embedding-004

        if ($useVertex) {
            $projectId = config('gemini.vertex.project_id');
            $location = config('gemini.vertex.location');
            $url = "https://{$location}-aiplatform.googleapis.com/v1/projects/{$projectId}/locations/{$location}/publishers/google/models/{$model}:predict";
            
            // Lấy token (tạm thời copy logic từ ChatbotService hoặc dùng helper)
            // Để đơn giản tôi sẽ dùng trực tiếp logic token ở đây
            $token = $this->getVertexAccessToken();
            
            $response = Http::withToken($token)
                ->post($url, [
                    'instances' => [['content' => $text]]
                ]);
            
            return $response->json()['predictions'][0]['embeddings']['values'] ?? null;
        } else {
            $apiKey = config('gemini.api_key');
            $baseUrl = config('gemini.base_url');
            $response = Http::withHeaders(['Content-Type' => 'application/json'])
                ->post("{$baseUrl}/{$model}:embedContent?key={$apiKey}", [
                    'model' => 'models/' . $model,
                    'content' => ['parts' => [['text' => $text]]]
                ]);

            return $response->json()['embedding']['values'] ?? null;
        }
    }

    private function getVertexAccessToken(): string
    {
        return \Illuminate\Support\Facades\Cache::remember('vertex_access_token', 3500, function () {
            $keyPath = config('gemini.vertex.credentials_path');
            $keyData = json_decode(file_get_contents($keyPath), true);
            $clientEmail = $keyData['client_email'];
            $privateKey = $keyData['private_key'];

            $now = time();
            $header = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
            $payload = base64_encode(json_encode([
                'iss' => $clientEmail,
                'scope' => 'https://www.googleapis.com/auth/cloud-platform',
                'aud' => 'https://oauth2.googleapis.com/token',
                'iat' => $now,
                'exp' => $now + 3600
            ]));

            $signature = '';
            openssl_sign("$header.$payload", $signature, $privateKey, OPENSSL_ALGO_SHA256);
            $jwt = "$header.$payload." . base64_encode($signature);

            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt
            ]);

            return $response->json()['access_token'];
        });
    }

    private function cosineSimilarity($vecA, $vecB)
    {
        $dot = 0; $magA = 0; $magB = 0;
        foreach ($vecA as $i => $val) {
            if (!isset($vecB[$i])) continue;
            $dot += $val * $vecB[$i];
            $magA += $val * $val;
            $magB += $vecB[$i] * $vecB[$i];
        }
        return ($magA * $magB) == 0 ? 0 : $dot / (sqrt($magA) * sqrt($magB));
    }
}
