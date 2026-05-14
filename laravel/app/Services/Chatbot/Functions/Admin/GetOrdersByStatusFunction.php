<?php

namespace App\Services\Chatbot\Functions\Admin;

use App\Services\Chatbot\Functions\ChatFunctionInterface;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GetOrdersByStatusFunction implements ChatFunctionInterface
{
    public function getName(): string
    {
        return 'getOrdersByStatus';
    }

    public function getDescription(): string
    {
        return 'Liệt kê danh sách các đơn hàng theo trạng thái cụ thể (ví dụ: cancelled, pending, completed) trong một khoảng thời gian.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'status' => [
                    'type' => 'string',
                    'description' => 'Trạng thái đơn hàng cần lọc (ví dụ: cancelled, processing, delivered, v.v.)',
                    'enum' => ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned']
                ],
                'period' => [
                    'type' => 'string',
                    'description' => 'Khoảng thời gian (today, yesterday, week, month, year).',
                    'default' => 'month'
                ],
                'limit' => [
                    'type' => 'integer',
                    'description' => 'Số lượng đơn hàng tối đa muốn hiển thị.',
                    'default' => 10
                ]
            ],
            'required' => ['status']
        ];
    }

    public function execute(array $args): array
    {
        $status = $args['status'];
        $period = $args['period'] ?? 'month';
        $limit = $args['limit'] ?? 10;

        $startDate = Carbon::now();
        $endDate = Carbon::now();

        switch ($period) {
            case 'today':
                $startDate = Carbon::today();
                break;
            case 'yesterday':
                $startDate = Carbon::yesterday();
                $endDate = Carbon::yesterday()->endOfDay();
                break;
            case 'week':
                $startDate = Carbon::now()->startOfWeek();
                break;
            case 'year':
                $startDate = Carbon::now()->startOfYear();
                break;
            case 'month':
            default:
                $startDate = Carbon::now()->startOfMonth();
                break;
        }

        $orders = DB::table('orders')
            ->where('status', $status)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select('code', 'customer_name', 'total_amount', 'created_at')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return [
            'status' => $status,
            'period' => $period,
            'count' => $orders->count(),
            'orders' => $orders->map(function($order) {
                return [
                    'code' => $order->code,
                    'customer' => $order->customer_name,
                    'amount' => number_format($order->total_amount, 0, ',', '.') . 'đ',
                    'date' => Carbon::parse($order->created_at)->format('d/m/Y H:i')
                ];
            })->toArray()
        ];
    }
}
