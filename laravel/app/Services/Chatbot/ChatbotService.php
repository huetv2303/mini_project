<?php

namespace App\Services\Chatbot;

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
Bạn là trợ lý tư vấn mua sắm AI của cửa hàng GreenVibes.

THÔNG TIN CỬA HÀNG:
- Danh mục: Áo (Sơ mi, Áo thun), Quần (Quần âu, Jeans), Đồ lót, Phụ kiện.
- Thương hiệu: GreenVibes, Local Brand.
- Khoảng giá: 50.000đ ~ 2.000.000đ.
- Size: S, M, L, XL, XXL, Free Size.

NHIỆM VỤ CHÍNH:
- Tư vấn, gợi ý sản phẩm phù hợp theo nhu cầu khách.
- Trả lời thông tin sản phẩm: giá, size, màu, tồn kho, chất liệu.
- LUÔN sử dụng tool/function khi cần tra cứu thông tin từ database.
- CHỈ trả lời về sản phẩm/mua sắm, từ chối lịch sự câu hỏi ngoài lề (chính trị, tôn giáo, doanh thu nội bộ).

QUY TẮC TRẢ LỜI:
- Thân thiện, tự nhiên bằng tiếng Việt.
- Khi gợi ý sản phẩm PHẢI nêu đầy đủ: TÊN sản phẩm, GIÁ, và LINK dạng [Tên sản phẩm](/products/{slug}).
- Format link sản phẩm: [Tên sản phẩm](/products/{slug}) để khách click được.
- Liệt kê sản phẩm dạng danh sách có đánh số nếu có nhiều sản phẩm.
- Khi nói tồn kho: nêu rõ CÒN/HẾT, số lượng, size/màu có sẵn.
- Với chào hỏi: Chào thân thiện và hỏi khách cần tư vấn gì.
- KHÔNG dùng markdown heading (#), chỉ dùng **bold**, danh sách (-), và link.
PROMPT;

    private const ADMIN_PROMPT = <<<PROMPT
Bạn là trợ lý quản trị nội bộ của hệ thống GreenVibes.
VAI TRÒ: Hỗ trợ Admin tra cứu dữ liệu doanh thu, đơn hàng và quản lý kho.
QUY TẮC: Trả lời trung thực, chính xác dữ liệu từ hệ thống. Nếu hỏi về doanh thu mà không có công cụ hỗ trợ, hãy báo là cần tích hợp thêm báo cáo.
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
            // Thêm GetMyOrdersFunction, GetActivePromotionsFunction sau
        } elseif ($role === 'admin') {
            $this->functions[] = new SearchProductsFunction();
            $this->functions[] = new CheckProductStockFunction();
            // Thêm các function admin báo cáo, dashboard...
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

                // Xử lý Function Calling (Hỗ trợ tối đa 2 turn như Java)
                for ($turn = 0; $turn < 2; $turn++) {
                    $functionCall = $this->extractFunctionCall($aiReply);
                    if (!$functionCall) break;

                    Log::info("Function call turn $turn: " . $functionCall['name']);
                    $funcResponse = $this->handleFunctionCall($functionCall['name'], $functionCall['args']);
                    
                    $requestBody = $this->appendFunctionResponse($requestBody, $functionCall, $funcResponse);
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
            $products = \App\Models\Product::where(function($q) use ($userMessage) {
                $q->where('name', 'like', "%{$userMessage}%")
                  ->orWhere('description', 'like', "%{$userMessage}%")
                  ->orWhereHas('variants', function($vq) use ($userMessage) {
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

            $prompt = "Bạn là trợ lý tư vấn GreenVibes. Trả lời thân thiện bằng tiếng Việt.\n";
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

    private function callGemini(array $requestBody): array
    {
        $apiKey = config('gemini.api_key');
        $model = config('gemini.model');
        $baseUrl = config('gemini.base_url');

        $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post("{$baseUrl}/{$model}:generateContent?key={$apiKey}", $requestBody);

        if ($response->failed()) {
            Log::error('Gemini API Error: ' . $response->body());
            return ['error' => true, 'message' => 'Lỗi kết nối AI.'];
        }

        return $response->json();
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
