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
            $query = Product::where('status', 'active')
                ->where(function($q) use ($keyword) {
                    $q->where('name', 'like', "%{$keyword}%")
                      ->orWhereHas('variants', function($vq) use ($keyword) {
                          $vq->where('name', 'like', "%{$keyword}%");
                      });
                })
                ->with(['variants.attributes', 'variants.inventories', 'category']);
                
            if ($maxPrice) {
                $query->whereHas('variants', function ($q) use ($maxPrice) {
                    $q->where('price', '<=', $maxPrice);
                });
            }
            $products = $query->take($limit)->get();
        }

        // 4. Format kết quả trả về cho AI
        if ($products->isEmpty()) {
            return ['message' => 'Không tìm thấy sản phẩm nào phù hợp.'];
        }

        $result = [];
        foreach ($products as $p) {
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
        $apiKey = config('gemini.api_key');
        $model = config('gemini.embedding_model');
        $baseUrl = config('gemini.base_url');
        
        $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post("{$baseUrl}/{$model}:embedContent?key={$apiKey}", [
                'model' => 'models/' . $model,
                'content' => ['parts' => [['text' => $text]]]
            ]);

        return $response->json()['embedding']['values'] ?? null;
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
