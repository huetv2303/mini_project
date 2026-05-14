<?php

namespace App\Services\Chatbot\Functions\Customer;

use App\Services\Chatbot\Functions\ChatFunctionInterface;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GetMyOrderStatusFunction implements ChatFunctionInterface
{
    public function getName(): string
    {
        return 'getMyOrderStatus';
    }

    public function getDescription(): string
    {
        return 'Tra cứu trạng thái và hành trình của một đơn hàng cụ thể dành cho khách hàng.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'order_code' => [
                    'type' => 'string',
                    'description' => 'Mã đơn hàng cần tra cứu (ví dụ: ORD-123456).'
                ]
            ],
            'required' => ['order_code']
        ];
    }

    public function execute(array $args): array
    {
        $code = $args['order_code'];
        // Lấy userId từ context của hệ thống nếu cần, nhưng ở đây chúng ta sẽ tra cứu theo mã đơn
        // Lưu ý: Trong thực tế nên kiểm tra thêm số điện thoại hoặc email để bảo mật nếu khách chưa login
        
        $order = DB::table('orders')
            ->where('code', $code)
            ->select('code', 'status', 'total_amount', 'created_at', 'customer_name', 'shipping_address')
            ->first();

        if (!$order) {
            return [
                'found' => false,
                'message' => "Rất tiếc, tôi không tìm thấy đơn hàng có mã $code. Bạn vui lòng kiểm tra lại mã đơn nhé!"
            ];
        }

        $statusMap = [
            'pending' => 'Đang chờ xác nhận',
            'processing' => 'Đang xử lý chuẩn bị hàng',
            'shipped' => 'Đang được giao đến bạn',
            'delivered' => 'Đã giao hàng thành công',
            'completed' => 'Đơn hàng đã hoàn tất',
            'cancelled' => 'Đơn hàng đã bị hủy',
            'returned' => 'Đơn hàng đã trả về kho'
        ];

        return [
            'found' => true,
            'code' => $order->code,
            'status' => $statusMap[$order->status] ?? $order->status,
            'customer' => $order->customer_name,
            'amount' => number_format($order->total_amount, 0, ',', '.') . 'đ',
            'date' => Carbon::parse($order->created_at)->format('d/m/Y'),
            'address' => $order->shipping_address
        ];
    }
}
