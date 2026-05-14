<?php

namespace App\Services\Chatbot\Functions\Admin;

use App\Services\Chatbot\Functions\ChatFunctionInterface;
use Illuminate\Support\Facades\DB;

class GetTopCustomersFunction implements ChatFunctionInterface
{
    public function getName(): string
    {
        return 'getTopCustomers';
    }

    public function getDescription(): string
    {
        return 'Liệt kê danh sách những khách hàng mua nhiều nhất hoặc chi tiêu nhiều nhất. Dùng khi Admin hỏi về khách hàng thân thiết hoặc khách hàng VIP.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'limit' => [
                    'type' => 'integer',
                    'description' => 'Số lượng khách hàng muốn xem (mặc định là 5).',
                    'default' => 5
                ],
                'sort_by' => [
                    'type' => 'string',
                    'enum' => ['total_spent', 'total_orders'],
                    'description' => 'Sắp xếp theo tổng tiền chi tiêu (total_spent) hoặc số lượng đơn hàng (total_orders).',
                    'default' => 'total_spent'
                ]
            ]
        ];
    }

    public function execute(array $args): array
    {
        $limit = $args['limit'] ?? 5;
        $sortBy = $args['sort_by'] ?? 'total_spent';

        $customers = DB::table('customer_profiles')
            ->join('users', 'customer_profiles.user_id', '=', 'users.id')
            ->select(
                'users.name',
                'customer_profiles.phone',
                'customer_profiles.total_spent',
                'customer_profiles.total_orders',
                'customer_profiles.loyalty_tier'
            )
            ->orderBy($sortBy, 'desc')
            ->limit($limit)
            ->get();

        return [
            'sort_by' => $sortBy,
            'customers' => $customers->map(function($c) {
                return [
                    'name' => $c->name,
                    'phone' => $c->phone,
                    'total_spent' => number_format($c->total_spent, 0, ',', '.') . 'đ',
                    'total_orders' => $c->total_orders,
                    'tier' => $c->loyalty_tier
                ];
            })->toArray()
        ];
    }
}
