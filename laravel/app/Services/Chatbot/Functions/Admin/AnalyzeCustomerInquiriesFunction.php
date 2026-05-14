<?php

namespace App\Services\Chatbot\Functions\Admin;

use App\Services\Chatbot\Functions\ChatFunctionInterface;
use Illuminate\Support\Facades\DB;

class AnalyzeCustomerInquiriesFunction implements ChatFunctionInterface
{
    public function getName(): string
    {
        return 'analyzeCustomerInquiries';
    }

    public function getDescription(): string
    {
        return 'Lấy danh sách các câu hỏi gần đây của khách hàng thực tế (không phải admin) để phân tích nhu cầu và mối quan tâm của họ.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'limit' => [
                    'type' => 'integer',
                    'description' => 'Số lượng tin nhắn gần đây muốn lấy để phân tích (mặc định 50).',
                    'default' => 50
                ]
            ]
        ];
    }

    public function execute(array $args): array
    {
        $limit = $args['limit'] ?? 50;

        // Lấy danh sách ID của Admin để loại trừ
        $adminIds = DB::table('users')
            ->join('roles', 'users.role_id', '=', 'roles.id')
            ->where('roles.name', 'LIKE', '%Admin%')
            ->pluck('users.id')
            ->toArray();

        // Lấy tin nhắn từ khách hàng (không nằm trong danh sách admin)
        $messages = DB::table('chat_messages')
            ->where('role', 'user')
            ->whereNotIn('user_id', $adminIds)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->select('content', 'created_at')
            ->get();

        return [
            'total_analyzed' => $messages->count(),
            'messages' => $messages->pluck('content')->toArray(),
            'note' => 'Dưới đây là danh sách các nội dung khách hàng đã hỏi. Hãy tổng hợp các chủ đề chính mà họ quan tâm.'
        ];
    }
}
