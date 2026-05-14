<?php

namespace App\Services\Chatbot;

use App\Services\Chatbot\Functions\Admin\AnalyzeCustomerInquiriesFunction;
use App\Services\Chatbot\Functions\Admin\GetInventoryAlertsFunction;
use App\Services\Chatbot\Functions\Admin\GetOrdersByStatusFunction;
use App\Services\Chatbot\Functions\Admin\GetPromotionStatsFunction;
use App\Services\Chatbot\Functions\Admin\GetRevenueStatsFunction;
use App\Services\Chatbot\Functions\Admin\GetTopCustomersFunction;
use App\Services\Chatbot\Functions\Admin\SearchOrderDetailsFunction;
use App\Services\Chatbot\Functions\Admin\UpdateOrderStatusFunction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\Chatbot\Functions\Customer\SearchProductsFunction;
use App\Services\Chatbot\Functions\Customer\CheckProductStockFunction;
// Tương lai sẽ thêm các function cho admin ở đây

class ChatbotService
{
    protected ChatHistoryService $historyService;
    protected array $functions = [];

    private const CUSTOMER_PROMPT = <<<PROMPT
Bạn là trợ lý tư vấn mua sắm AI của cửa hàng Trendora.

THÔNG TIN CỬA HÀNG:
- Danh mục: Áo (Sơ mi, Áo thun), Quần (Quần âu, Jeans), Đồ lót, Phụ kiện.
- Thương hiệu: Trendora, Local Brand.
- Khoảng giá: 50.000đ ~ 2.000.000đ.
- Size: S, M, L, XL, XXL, Free Size.

NHIỆM VỤ CHÍNH:
1. Tư vấn, gợi ý sản phẩm phù hợp. Khi khách hỏi tìm đồ, bạn BẮT BUỘC dùng 'searchProducts'.
2. Trả lời tồn kho: Khi khách hỏi size/màu còn không, bạn BẮT BUỘC dùng 'checkProductStock'.
3. Tra cứu đơn hàng: Khi khách hỏi đơn của mình tới đâu, bạn BẮT BUỘC dùng 'getMyOrderStatus'.
4. Săn khuyến mãi: Khi khách hỏi voucher/giảm giá, bạn BẮT BUỘC dùng 'getActivePromotions'.
5. CHỈ trả lời về mua sắm, từ chối lịch sự câu hỏi ngoài lề (chính trị, tôn giáo, doanh thu nội bộ).

QUY TẮC TRÌNH BÀY:
- Thân thiện, tự nhiên, dùng nhiều Emoji (🌸, ✨, 📦...).
- Link sản phẩm PHẢI đúng định dạng: [Tên sản phẩm](/products/{slug}).
- KHÔNG dùng bảng Markdown. Hãy trình bày bằng danh sách gạch đầu dòng (-).
- KHÔNG dùng markdown heading (#), chỉ dùng **bold**.
PROMPT;

    private const ADMIN_PROMPT = <<<PROMPT
Bạn là trợ lý quản trị nội bộ của hệ thống Trendora.
VAI TRÒ: Hỗ trợ Admin tra cứu dữ liệu doanh thu, đơn hàng và quản lý kho.
1. Khi được hỏi về hàng sắp hết, tồn kho thấp, hoặc tình hình kho, bạn BẮT BUỘC phải gọi công cụ 'getInventoryAlerts'.
2. Khi được hỏi về doanh thu, tình trạng đơn hàng (bao gồm cả đơn bị hủy), hoặc top sản phẩm, bạn BẮT BUỘC phải gọi công cụ 'getRevenueStats'.
3. Khi Admin yêu cầu liệt kê danh sách hoặc mã đơn hàng theo trạng thái, bạn BẮT BUỘC phải gọi công cụ 'getOrdersByStatus'.
4. Khi Admin hỏi về khách hàng thân thiết, khách hàng VIP, bạn BẮT BUỘC phải gọi công cụ 'getTopCustomers'.
5. Khi Admin hỏi về hiệu quả khuyến mãi, mã giảm giá, bạn BẮT BUỘC phải gọi công cụ 'getPromotionStats'.
6. Khi Admin hỏi về nhu cầu khách hàng, họ đang quan tâm gì, hoặc họ hay hỏi về vấn đề gì, bạn BẮT BUỘC phải gọi công cụ 'analyzeCustomerInquiries'.
7. Khi Admin muốn đổi trạng thái đơn hàng, bạn BẮT BUỘC phải gọi công cụ 'updateOrderStatus'.
8. Khi Admin cung cấp mã đơn (ORD-...), bạn BẮT BUỘC phải gọi công cụ 'searchOrderDetails'.
9. KHÔNG ĐƯỢC dùng Bảng Markdown. Hãy dùng Danh sách (-) và Emoji để trình bày.
10. Luôn trung thực và dựa trên dữ liệu hệ thống. Nếu không tìm thấy, hãy báo cáo rõ ràng.
PROMPT;

    public function __construct(ChatHistoryService $historyService)
    {
        $this->historyService = $historyService;
    }

    public function chat(string $message, string $sessionId, ?int $userId, string $role = 'customer'): array
    {
        // 1. Xác định prompt và tools theo role
        $systemPrompt = $role === 'admin' ? self::ADMIN_PROMPT : self::CUSTOMER_PROMPT;

        $this->functions = [];
        if ($role === 'customer' || $role === 'guest') {
            $this->functions[] = new SearchProductsFunction();
            $this->functions[] = new CheckProductStockFunction();
            $this->functions[] = new \App\Services\Chatbot\Functions\Customer\GetMyOrderStatusFunction();
            $this->functions[] = new \App\Services\Chatbot\Functions\Customer\GetActivePromotionsFunction();
        } elseif ($role === 'admin') {
            $this->functions[] = new SearchProductsFunction();
            $this->functions[] = new CheckProductStockFunction();
            $this->functions[] = new GetRevenueStatsFunction();
            $this->functions[] = new GetInventoryAlertsFunction();
            $this->functions[] = new SearchOrderDetailsFunction();
            $this->functions[] = new GetOrdersByStatusFunction();
            $this->functions[] = new GetTopCustomersFunction();
            $this->functions[] = new GetPromotionStatsFunction();
            $this->functions[] = new UpdateOrderStatusFunction();
            $this->functions[] = new AnalyzeCustomerInquiriesFunction();
            $this->functions[] = new \App\Services\Chatbot\Functions\Customer\GetMyOrderStatusFunction();
            $this->functions[] = new \App\Services\Chatbot\Functions\Customer\GetActivePromotionsFunction();
        }

        // 2. Lưu tin nhắn user
        $this->historyService->addMessage($sessionId, 'user', $message, $userId);

        // 3. Gọi Gemini với cơ chế Retry
        $aiReply = $this->callGeminiWithRetry($message, $sessionId, $userId, $systemPrompt);

        $finalText = $this->extractText($aiReply);

        // 4. Lưu tin nhắn AI
        $this->historyService->addMessage($sessionId, 'model', $finalText, $userId);

        // 5. Trích xuất suggestions cards (UI)
        $suggestions = $this->extractSuggestions($finalText);

        return [
            'reply' => $finalText,
            'suggestions' => $suggestions
        ];
    }

    private function buildRequest(string $message, string $sessionId, ?int $userId, string $systemPrompt): array
    {
        $contents = [];
        $history = $this->historyService->getHistoryForAI($sessionId, $userId);

        // Gắn history (bỏ tin nhắn cuối cùng do đã được add vào history nhưng AI cần gửi rời)
        // Lưu ý: getHistoryForAI đã bao gồm tin nhắn hiện tại vì addMessage chạy trước
        foreach ($history as $msg) {
            // Chuẩn hóa từng tin nhắn trong history để xóa bỏ snake_case cũ
            if (isset($msg['parts'])) {
                foreach ($msg['parts'] as &$p) {
                    if (isset($p['function_call'])) {
                        $p['functionCall'] = $p['function_call'];
                        unset($p['function_call']);
                    }
                    if (isset($p['function_response'])) {
                        $p['functionResponse'] = $p['function_response'];
                        unset($p['function_response']);
                    }

                    // Ép các mảng rỗng thành đối tượng {}
                    if (isset($p['functionCall']['args']) && empty($p['functionCall']['args'])) {
                        $p['functionCall']['args'] = new \stdClass();
                    }
                }
            }
            $contents[] = $msg;
        }

        $tools = [];
        foreach ($this->functions as $func) {
            $tools[] = [
                'name' => $func->getName(),
                'description' => $func->getDescription(),
                'parameters' => $func->getParameters()
            ];
        }

        $config = config('gemini.generation');

        return [
            'systemInstruction' => ['parts' => [['text' => $systemPrompt]]],
            'contents' => $contents,
            'tools' => empty($tools) ? [] : [['functionDeclarations' => $tools]],
            'generationConfig' => $config
        ];
    }

    private function callGeminiWithRetry(string $message, string $sessionId, ?int $userId, string $systemPrompt): array
    {
        $retryDelay = 2000;
        $maxRetries = 3;

        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                $requestBody = $this->buildRequest($message, $sessionId, $userId, $systemPrompt);
                $aiReply = $this->callGemini($requestBody);

                if (isset($aiReply['error']) && $aiReply['error'] === true) {
                    throw new \Exception("Gemini API Error or Quota Limit.");
                }

                $history = $requestBody['contents'];
                for ($turn = 0; $turn < 5; $turn++) {
                    $parts = $aiReply['candidates'][0]['content']['parts'] ?? [];
                    $functionCalls = [];
                    foreach ($parts as $part) {
                        $fc = $part['functionCall'] ?? $part['function_call'] ?? null;
                        if ($fc) {
                            $functionCalls[] = $fc;
                        }
                    }

                    if (empty($functionCalls)) break;

                    // Thêm phản hồi của AI vào lịch sử
                    $history[] = $aiReply['candidates'][0]['content'];

                    $responseParts = [];
                    foreach ($functionCalls as $fc) {
                        $name = $fc['name'];
                        $args = empty($fc['args']) ? (object)[] : $fc['args'];

                        Log::info("Function call turn $turn: $name", (array)$args);
                        $result = $this->handleFunctionCall($name, (array)$args);

                        $cleanResult = json_decode(json_encode($result), true);

                        $responseParts[] = [
                            'functionResponse' => [
                                'name' => $name,
                                'response' => $cleanResult
                            ]
                        ];
                    }

                    // Gửi kết quả lại cho AI (Dùng role 'function' hoặc 'user')
                    $history[] = [
                        'role' => 'user',
                        'parts' => $responseParts
                    ];

                    // LÀM SẠCH TOÀN BỘ HISTORY TRƯỚC KHI GỬI (Quan trọng)
                    foreach ($history as &$content) {
                        if (isset($content['parts'])) {
                            foreach ($content['parts'] as &$p) {
                                if (isset($p['function_call'])) {
                                    $p['functionCall'] = $p['function_call'];
                                    unset($p['function_call']);
                                }
                                if (isset($p['function_response'])) {
                                    $p['functionResponse'] = $p['function_response'];
                                    unset($p['function_response']);
                                }

                                // CỰC KỲ QUAN TRỌNG: Ép các mảng rỗng thành đối tượng {}
                                if (isset($p['functionCall']['args']) && empty($p['functionCall']['args'])) {
                                    $p['functionCall']['args'] = new \stdClass();
                                }
                            }
                        }
                    }

                    $requestBody['contents'] = $history;
                    $aiReply = $this->callGemini($requestBody);

                    if (isset($aiReply['error']) && $aiReply['error'] === true) {
                        throw new \Exception("Gemini API Error after function call turn $turn.");
                    }
                }

                return $aiReply;
            } catch (\Exception $e) {
                if ($attempt < $maxRetries) {
                    Log::info("Rate limit hoặc lỗi, retry sau {$retryDelay}ms... (Lần {$attempt})");
                    usleep($retryDelay * 1000);
                    $retryDelay *= 2;
                }
            }
        }

        // Fallback khi tất cả retry thất bại: Gọi chế độ Simple (Không function calling)
        Log::info("Chuyển sang chế độ Simple Fallback cho message: $message");
        return $this->callGeminiSimple($message);
    }

    private function callGeminiSimple(string $userMessage): array
    {
        try {
            // Tìm sản phẩm liên quan (Like query)
            $products = \App\Models\Product::where(function ($q) use ($userMessage) {
                $q->where('name', 'like', "%{$userMessage}%")
                    ->orWhere('description', 'like', "%{$userMessage}%")
                    ->orWhereHas('variants', function ($vq) use ($userMessage) {
                        $vq->where('name', 'like', "%{$userMessage}%");
                    });
            })
                ->where('status', 'active')
                ->with(['variants', 'category'])
                ->take(5)
                ->get();

            $productContext = "";
            if ($products->isNotEmpty()) {
                foreach ($products as $p) {
                    $price = number_format($p->variants->min('price') ?? 0, 0, ',', '.');
                    $productContext .= "- **{$p->name}** (Giá: {$price}đ). Link: /products/{$p->slug}\n";
                }
            }

            $prompt = "Bạn là trợ lý tư vấn Trendora. Trả lời thân thiện bằng tiếng Việt.\n";
            if ($productContext) {
                $prompt .= "Sản phẩm liên quan trong cửa hàng:\n{$productContext}\n";
                $prompt .= "Hãy trả lời đầy đủ thông tin sản phẩm (tên, giá, link).\n";
            } else {
                $prompt .= "Không tìm thấy sản phẩm nào phù hợp với yêu cầu.\n";
            }
            $prompt .= "\nKhách hàng hỏi: {$userMessage}";

            $requestBody = [
                'contents' => [['role' => 'user', 'parts' => [['text' => $prompt]]]],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'maxOutputTokens' => 1024
                ]
            ];

            $aiReply = $this->callGemini($requestBody);

            // Nếu gọi AI ở mode simple cũng lỗi (do Billing block)
            // Trả về kết quả thô luôn, không cần AI nữa
            if (isset($aiReply['error']) && $aiReply['error'] === true) {
                if ($productContext) {
                    return [
                        'candidates' => [[
                            'content' => [
                                'parts' => [[
                                    'text' => "Chào bạn! Hệ thống AI đang bảo trì, nhưng mình vẫn tìm thấy sản phẩm bạn cần đây:\n\n" . $productContext
                                ]]
                            ]
                        ]]
                    ];
                }
                return ['error' => true, 'message' => 'Lỗi kết nối AI.'];
            }

            return $aiReply;
        } catch (\Exception $e) {
            return ['error' => true, 'message' => 'Lỗi kết nối AI.'];
        }
    }

    private function callGemini(array $body): array
    {
        $useVertex = config('gemini.use_vertex', false);
        $model = config('gemini.model', 'gemini-1.5-flash');

        if ($useVertex) {
            $projectId = config('gemini.vertex.project_id');
            $location = config('gemini.vertex.location');
            $url = "https://{$location}-aiplatform.googleapis.com/v1/projects/{$projectId}/locations/{$location}/publishers/google/models/{$model}:generateContent";

            $token = $this->getVertexAccessToken();
            $response = Http::withToken($token)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post($url, $body);
        } else {
            $apiKey = config('gemini.api_key');
            $baseUrl = config('gemini.base_url');
            $response = Http::withHeaders(['Content-Type' => 'application/json'])
                ->post("{$baseUrl}/{$model}:generateContent?key={$apiKey}", $body);
        }

        if ($response->failed()) {
            Log::error("Gemini API Error: " . $response->body());
            return ['error' => true, 'message' => $response->json()['error']['message'] ?? 'API Error'];
        }

        return $response->json();
    }

    /**
     * Tạo Access Token từ Service Account JSON (OAuth2 JWT Flow)
     */
    private function getVertexAccessToken(): string
    {
        return \Illuminate\Support\Facades\Cache::remember('vertex_access_token', 3500, function () {
            $keyPath = config('gemini.vertex.credentials_path');
            if (!file_exists($keyPath)) {
                throw new \Exception("Service Account JSON file not found at: {$keyPath}");
            }

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

            if ($response->failed()) {
                throw new \Exception("Failed to get Vertex Access Token: " . $response->body());
            }

            return $response->json()['access_token'];
        });
    }

    private function extractFunctionCall(array $response): ?array
    {
        $parts = $response['candidates'][0]['content']['parts'] ?? [];
        foreach ($parts as $part) {
            if (isset($part['functionCall'])) {
                return $part['functionCall'];
            }
        }
        return null;
    }

    private function handleFunctionCall(string $name, array $args): array
    {
        foreach ($this->functions as $func) {
            if ($func->getName() === $name) {
                try {
                    return $func->execute($args);
                } catch (\Exception $e) {
                    Log::error("Function {$name} error: " . $e->getMessage());
                    return ['error' => 'Đã có lỗi xảy ra khi thực thi tool.'];
                }
            }
        }
        return ['error' => 'Function not found.'];
    }

    private function appendFunctionResponse(array $requestBody, array $functionCall, array $funcResponse): array
    {
        // 1. Thêm model's functionCall
        $requestBody['contents'][] = [
            'role' => 'model',
            'parts' => [['functionCall' => $functionCall]]
        ];

        // 2. Thêm user's functionResponse
        $requestBody['contents'][] = [
            'role' => 'user',
            'parts' => [[
                'functionResponse' => [
                    'name' => $functionCall['name'],
                    'response' => $funcResponse
                ]
            ]]
        ];

        return $requestBody;
    }

    private function extractText(array $response): string
    {
        if (isset($response['error']) && $response['error'] === true) {
            return "Xin lỗi, hệ thống đang bận. Bạn vui lòng thử lại sau nhé!";
        }

        $parts = $response['candidates'][0]['content']['parts'] ?? [];
        $text = "";
        foreach ($parts as $part) {
            if (isset($part['text']) && empty($part['thought'])) {
                $text .= $part['text'];
            }
        }
        return $text ?: "Xin chào, tôi có thể giúp gì cho bạn?";
    }

    private function extractSuggestions(string $text): array
    {
        $suggestions = [];
        // Match link pattern: /products/{slug}
        preg_match_all('/\/products\/([a-zA-Z0-9-]+)/', $text, $matches);

        if (!empty($matches[1])) {
            $slugs = array_unique($matches[1]);
            $products = \App\Models\Product::whereIn('slug', $slugs)
                ->where('status', 'active')
                ->take(5)
                ->get();

            foreach ($products as $p) {
                $suggestions[] = [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'price' => $p->variants->min('price') ?? 0,
                    'feature_image' => $p->feature_image,
                    'link' => "/products/{$p->slug}"
                ];
            }
        }
        return $suggestions;
    }
}
