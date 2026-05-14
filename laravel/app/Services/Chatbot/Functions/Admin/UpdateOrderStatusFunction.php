<?php

namespace App\Services\Chatbot\Functions\Admin;

use App\Services\Chatbot\Functions\ChatFunctionInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UpdateOrderStatusFunction implements ChatFunctionInterface
{
    public function getName(): string
    {
        return 'updateOrderStatus';
    }

    public function getDescription(): string
    {
        return 'Cập nhật trạng thái của một đơn hàng cụ thể. Dùng khi Admin yêu cầu đổi trạng thái đơn (ví dụ: sang đã giao, đã hủy, v.v.)';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'order_code' => [
                    'type' => 'string',
                    'description' => 'Mã đơn hàng cần cập nhật (ví dụ: ORD-12345)'
                ],
                'new_status' => [
                    'type' => 'string',
                    'description' => 'Trạng thái mới cần chuyển sang.',
                    'enum' => ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned']
                ],
                'note' => [
                    'type' => 'string',
                    'description' => 'Ghi chú lý do thay đổi (nếu có).'
                ]
            ],
            'required' => ['order_code', 'new_status']
        ];
    }

    public function execute(array $args): array
    {
        $code = $args['order_code'];
        $status = $args['new_status'];
        $note = $args['note'] ?? 'Cập nhật qua AI Chatbot';

        $order = DB::table('orders')->where('code', $code)->first();

        if (!$order) {
            return [
                'success' => false,
                'message' => "Không tìm thấy đơn hàng có mã $code."
            ];
        }

        try {
            DB::table('orders')->where('code', $code)->update([
                'status' => $status,
                'updated_at' => now()
            ]);

            // Tương lai có thể thêm ghi log vào bảng order_histories ở đây
            
            Log::info("Admin updated order $code to $status via Chatbot.");

            return [
                'success' => true,
                'message' => "Đã cập nhật đơn hàng $code sang trạng thái: $status.",
                'order_code' => $code,
                'new_status' => $status
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => "Lỗi khi cập nhật đơn hàng: " . $e->getMessage()
            ];
        }
    }
}
