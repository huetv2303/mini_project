<?php

namespace App\Services\Chatbot\Functions\Admin;

use App\Services\Chatbot\Functions\ChatFunctionInterface;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GetRevenueStatsFunction implements ChatFunctionInterface
{
    public function getName(): string
    {
        return 'getRevenueStats';
    }

    public function getDescription(): string
    {
        return 'Lấy thống kê doanh thu, số lượng đơn hàng và top sản phẩm bán chạy. Cần dùng khi Admin hỏi về báo cáo kinh doanh.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'period' => [
                    'type' => 'string',
                    'enum' => ['today', 'yesterday', 'this_week', 'this_month', 'last_month', 'this_year'],
                    'description' => 'Khoảng thời gian muốn thống kê.'
                ]
            ],
            'required' => ['period']
        ];
    }

    public function execute(array $args): array
    {
        $period = $args['period'] ?? 'today';
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

        // 1. Thống kê tổng quan doanh thu (Chỉ tính đơn hàng đã hoàn thành/thành công)
        $stats = DB::table('orders')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('status', ['completed', 'delivered', 'processing', 'shipped'])
            ->select(
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(final_amount) as total_revenue'),
                DB::raw('AVG(final_amount) as avg_order_value')
            )
            ->first();

        // 2. Thống kê số lượng đơn theo từng TRẠNG THÁI
        $statusStats = DB::table('orders')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        // 3. Thống kê KHÁCH HÀNG MỚI (Mới bổ sung)
        $newCustomersCount = DB::table('customer_profiles')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        // 4. Doanh thu theo DANH MỤC (Mới bổ sung)
        $categoryRevenue = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->whereIn('orders.status', ['completed', 'delivered', 'processing', 'shipped'])
            ->select('categories.name', DB::raw('SUM(order_items.subtotal) as revenue'))
            ->groupBy('categories.name')
            ->orderByDesc('revenue')
            ->get();

        // 5. Thống kê RIÊNG cho đơn HỦY (Mới bổ sung)
        $cancelledStats = DB::table('orders')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'cancelled')
            ->select(DB::raw('COUNT(*) as count'), DB::raw('SUM(total_amount) as total_lost'))
            ->first();

        // 6. Top 5 sản phẩm bán chạy
        $topProducts = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->whereIn('orders.status', ['completed', 'delivered', 'processing', 'shipped'])
            ->select(
                'order_items.product_name',
                DB::raw('SUM(order_items.quantity) as total_quantity'),
                DB::raw('SUM(order_items.subtotal) as revenue')
            )
            ->groupBy('order_items.product_name')
            ->orderByDesc('total_quantity')
            ->limit(5)
            ->get();

        return [
            'period' => $period,
            'time_range' => [
                'from' => $startDate->toDateTimeString(),
                'to' => $endDate->toDateTimeString()
            ],
            'summary' => [
                'total_orders' => $stats->total_orders ?? 0,
                'total_revenue' => number_format($stats->total_revenue ?? 0, 0, ',', '.') . 'đ',
                'avg_order_value' => number_format($stats->avg_order_value ?? 0, 0, ',', '.') . 'đ',
                'new_customers' => $newCustomersCount,
                'cancelled_orders' => [
                    'count' => $cancelledStats->count ?? 0,
                    'total_lost' => number_format($cancelledStats->total_lost ?? 0, 0, ',', '.') . 'đ'
                ]
            ],
            'order_status_breakdown' => $statusStats->toArray(),
            'revenue_by_category' => $categoryRevenue->toArray(),
            'top_products' => $topProducts->toArray()
        ];
    }
}
