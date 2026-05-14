<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        $user = Auth::guard('api')->user(); // Do gọi chung public route, cần check guard

        $userId = $user ? $user->id : null;
        
        // Xác định vai trò (Giả sử role_id = 1 là Admin)
        $role = 'guest';
        if ($user) {
            $role = ($user->role_id == 1 || $user->hasPermission('admin.manage')) ? 'admin' : 'customer';
        }

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
        $messages = \App\Models\ChatMessage::where('user_id', $user->id)
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
