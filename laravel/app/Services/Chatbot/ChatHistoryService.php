<?php

namespace App\Services\Chatbot;

use App\Models\ChatMessage;
use Illuminate\Support\Facades\Redis;

class ChatHistoryService
{
    /**
     * Lưu tin nhắn vào lịch sử
     */
    public function addMessage(string $sessionId, string $role, string $content, ?int $userId = null): void
    {
        if ($userId) {
            // User đã login -> lưu vào DB
            ChatMessage::create([
                'user_id' => $userId,
                'session_id' => $sessionId,
                'role' => $role,
                'content' => $content
            ]);
        } else {
            // Guest -> lưu vào Redis
            $key = "chat:history:{$sessionId}";
            $message = [
                'role' => $role,
                'content' => $content,
                'timestamp' => now()->timestamp
            ];

            Redis::rpush($key, json_encode($message));
            
            // Cắt bớt, chỉ giữ max_messages
            $maxMessages = config('gemini.history.max_messages', 20);
            Redis::ltrim($key, -$maxMessages, -1);
            
            // Gia hạn TTL
            $ttl = config('gemini.history.ttl_hours', 24) * 3600;
            Redis::expire($key, $ttl);
        }
    }

    /**
     * Lấy lịch sử chat format chuẩn cho Gemini API
     */
    public function getHistoryForAI(string $sessionId, ?int $userId = null): array
    {
        $history = [];
        
        if ($userId) {
            $messages = ChatMessage::where('user_id', $userId)
                                 ->orderBy('created_at', 'desc')
                                 ->take(config('gemini.history.max_messages', 20))
                                 ->get()
                                 ->reverse();
            
            foreach ($messages as $msg) {
                $history[] = [
                    'role' => $msg->role,
                    'parts' => [['text' => $msg->content]]
                ];
            }
        } else {
            $key = "chat:history:{$sessionId}";
            $rawList = Redis::lrange($key, 0, -1);
            
            foreach ($rawList as $item) {
                $msg = json_decode($item, true);
                if (isset($msg['role'], $msg['content'])) {
                    $history[] = [
                        'role' => $msg['role'],
                        'parts' => [['text' => $msg['content']]]
                    ];
                }
            }
        }
        
        return $history;
    }

    /**
     * Xóa lịch sử
     */
    public function clearHistory(string $sessionId, ?int $userId = null): void
    {
        if ($userId) {
            ChatMessage::where('user_id', $userId)->delete();
        } else {
            Redis::del("chat:history:{$sessionId}");
        }
    }
}
