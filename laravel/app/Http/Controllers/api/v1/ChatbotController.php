<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Services\Chatbot\ChatbotService;
use App\Services\Chatbot\ChatHistoryService;

class ChatbotController extends Controller
{
    protected ChatbotService $chatbotService;
    protected ChatHistoryService $historyService;

    public function __construct(ChatbotService $chatbotService, ChatHistoryService $historyService)
    {
        $this->chatbotService = $chatbotService;
        $this->historyService = $historyService;
    }

    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'session_id' => 'nullable|string|max:100'
        ]);

        $message = $request->input('message');
        $sessionId = $request->input('session_id') ?: Str::uuid()->toString();
        // 1. Kiểm tra user từ Guard (Token API hoặc Session Web)
        $user = auth()->user() ?: Auth::guard('api')->user();
        $userId = $user ? $user->id : null;

        // 2. Xác định vai trò mặc định từ User
        $role = 'guest';
        if ($user) {
            $isAdmin = ($user->role_id == 1 || (isset($user->role) && $user->role == 'admin'));
            $role = $isAdmin ? 'admin' : 'customer';
        }

        // 3. CƠ CHẾ ƯU TIÊN CHO ADMIN TRÊN WEB (LOCAL DEBUG)
        $origin = $request->header('Origin', '');
        $currentPath = $request->input('current_path', $request->header('Referer', ''));

        if (config('app.debug')) {
            // Nếu gửi từ localhost:3001 VÀ đường dẫn có chứa /admin
            if (str_contains($origin, 'localhost:3001') && str_contains($currentPath, '/admin')) {
                $role = 'admin';
            }
        }

        Log::info("Chatbot Request Debug:", [
            'origin' => $origin,
            'current_path' => $currentPath,
            'detected_role' => $role,
            'user_id' => $userId,
            'message' => $message
        ]);

        $result = $this->chatbotService->chat($message, $sessionId, $userId, $role);

        return response()->json([
            'reply' => $result['reply'],
            'session_id' => $sessionId,
            'suggestions' => $result['suggestions'],
            'is_logged_in' => !!$userId,
            'role' => $role
        ]);
    }

    public function history(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([], 401);
        }

        // Lấy lịch sử từ DB
        $messages = ChatMessage::where('user_id', $user->id)
            ->orderBy('created_at', 'asc')
            ->take(20)
            ->get(['role', 'content']);

        return response()->json($messages);
    }

    public function clearHistory(Request $request)
    {
        $sessionId = $request->input('session_id');
        $userId = Auth::id();

        $this->historyService->clearHistory((string)$sessionId, $userId);

        return response()->json(['message' => 'Đã xóa lịch sử trò chuyện.']);
    }
}
