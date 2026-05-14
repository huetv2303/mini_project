<?php

namespace App\Services\Chatbot\Functions\Admin;

use App\Services\Chatbot\Functions\ChatFunctionInterface;
use Illuminate\Support\Facades\DB;

class SearchOrderDetailsFunction implements ChatFunctionInterface
{
    public function getName(): string
    {
        return 'searchOrderDetails';
    }

    public function getDescription(): string
    {
        return 'Tra cứu chi tiết một đơn hàng cụ thể bằng mã đơn hàng (Order Code).';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'order_code' => [
                    'type' => 'string',
                    'description' => 'Mã đơn hàng (ví dụ: ORD-123456).'
                ]
            ],
            'required' => ['order_code']
        ];
    }

    public function execute(array $args): array
    {
        $code = $args['order_code'];

        $order = DB::table('orders')
            ->where('code', $code)
            ->first();

        if (!$order) {
            return ['error' => true, 'message' => "Không tìm thấy đơn hàng có mã: $code"];
        }

        $items = DB::table('order_items')
            ->where('order_id', $order->id)
            ->get();

        return [
            'order_info' => [
                'code' => $order->code,
                'customer_name' => $order->customer_name,
                'customer_phone' => $order->customer_phone,
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'total_amount' => number_format($order->total_amount, 0, ',', '.') . 'đ',
                'final_amount' => number_format($order->final_amount, 0, ',', '.') . 'đ',
                'shipping_address' => $order->shipping_address,
                'created_at' => $order->created_at
            ],
            'items' => $items->toArray()
        ];
    }
}
