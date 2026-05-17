<?php

namespace App\Services\Chatbot\Functions\Admin;

use App\Services\Chatbot\Functions\ChatFunctionInterface;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GetTaxStatsFunction implements ChatFunctionInterface
{
    public function getName(): string
    {
        return 'getTaxStats';
    }

    public function getDescription(): string
    {
        return 'Lấy thống kê về thuế và các đơn hàng áp dụng thuế. Dùng khi Admin hỏi về số tiền thuế, doanh thu thuế, hoặc số đơn hàng áp dụng thuế.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'period' => [
                    'type' => 'string',
                    'enum' => ['today', 'yesterday', 'this_week', 'this_month', 'last_month', 'this_year'],
                    'description' => 'Khoảng thời gian muốn thống kê thuế.'
                ]
            ],
            'required' => ['period']
        ];
    }

    public function execute(array $args): array
    {
        $period = $args['period'] ?? 'this_month';
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
            case 'this_week':
                $startDate = Carbon::now()->startOfWeek();
                break;
            case 'this_month':
                $startDate = Carbon::now()->startOfMonth();
                break;
            case 'last_month':
                $startDate = Carbon::now()->subMonth()->startOfMonth();
                $endDate = Carbon::now()->subMonth()->endOfMonth();
                break;
            case 'this_year':
                $startDate = Carbon::now()->startOfYear();
                break;
        }

        // 1. Thống kê tổng quan thuế (Chỉ tính đơn hàng hợp lệ)
        $stats = DB::table('orders')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('status', ['completed', 'delivered', 'processing', 'shipped'])
            ->select(
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(final_amount) as total_revenue'),
                DB::raw('COUNT(CASE WHEN tax_amount > 0 THEN 1 END) as taxed_orders_count'),
                DB::raw('SUM(tax_amount) as total_tax_amount')
            )
            ->first();

        // 2. Danh sách 10 đơn hàng chịu thuế gần nhất để tham chiếu
        $taxedOrders = DB::table('orders')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('status', ['completed', 'delivered', 'processing', 'shipped'])
            ->where('tax_amount', '>', 0)
            ->select('code', 'customer_name', 'tax_rate_snapshot', 'tax_amount', 'final_amount', 'created_at')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return [
            'period' => $period,
            'time_range' => [
                'from' => $startDate->toDateTimeString(),
                'to' => $endDate->toDateTimeString()
            ],
            'summary' => [
                'total_orders' => $stats->total_orders ?? 0,
                'taxed_orders_count' => $stats->taxed_orders_count ?? 0,
                'taxed_orders_ratio' => ($stats->total_orders ?? 0) > 0 
                    ? round(($stats->taxed_orders_count / $stats->total_orders) * 100, 2) . '%'
                    : '0%',
                'total_revenue' => number_format($stats->total_revenue ?? 0, 0, ',', '.') . 'đ',
                'total_tax_amount' => number_format($stats->total_tax_amount ?? 0, 0, ',', '.') . 'đ',
                'avg_tax_per_taxed_order' => ($stats->taxed_orders_count ?? 0) > 0
                    ? number_format(round($stats->total_tax_amount / $stats->taxed_orders_count), 0, ',', '.') . 'đ'
                    : '0đ'
            ],
            'recent_taxed_orders' => $taxedOrders->map(function($o) {
                return [
                    'order_number' => $o->code,
                    'customer_name' => $o->customer_name,
                    'tax_rate_snapshot' => $o->tax_rate_snapshot . '%',
                    'tax_amount' => number_format($o->tax_amount, 0, ',', '.') . 'đ',
                    'final_amount' => number_format($o->final_amount, 0, ',', '.') . 'đ',
                    'created_at' => Carbon::parse($o->created_at)->format('d/m/Y H:i')
                ];
            })->toArray()
        ];
    }
}
