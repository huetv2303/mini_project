<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function statistics(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $isFiltered = $startDate && $endDate;

        if ($isFiltered) {
            $start = Carbon::parse($startDate)->startOfDay();
            $end = Carbon::parse($endDate)->endOfDay();
        } else {
            $start = Carbon::now()->startOfMonth();
            $end = Carbon::now()->endOfMonth();
        }

        $revenueMonth = Order::whereBetween('created_at', [$start, $end])
            ->whereIn('status', ['delivered', 'completed'])
            ->sum('final_amount');

        $revenueToday = Order::whereDate('created_at', Carbon::today())
            ->whereIn('status', ['delivered', 'completed'])
            ->sum('final_amount');

        $totalOrders = Order::whereBetween('created_at', [$start, $end])->count();
        $pendingOrders = Order::whereBetween('created_at', [$start, $end])->where('status', 'pending')->count();

        $inventoryWarnings = Inventory::where('quantity', '<=', 'min_quantity')->count();

        $reviewsToday = 0;

        $chartStart = $isFiltered ? $start->copy() : Carbon::now()->subDays(29)->startOfDay();
        $chartEnd = $isFiltered ? $end->copy() : Carbon::now()->endOfDay();

        $revenueData = Order::whereBetween('created_at', [$chartStart, $chartEnd])
            ->whereIn('status', ['delivered', 'completed'])
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(final_amount) as total'))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        $revenueChart = [];
        $currentDate = $chartStart->copy();
        while ($currentDate->lte($chartEnd)) {
            $dateString = $currentDate->format('Y-m-d');
            $revenue = $revenueData->firstWhere('date', $dateString);
            $revenueChart[] = [
                'date' => $currentDate->format('d/m'),
                'revenue' => $revenue ? (float) $revenue->total : 0,
            ];
            $currentDate->addDay();
        }

        $orderStatuses = Order::whereBetween('created_at', [$chartStart, $chartEnd])
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        $statusMapping = [
            'pending' => 'Chờ xử lý',
            'processing' => 'Đang đóng gói',
            'shipped' => 'Đang giao',
            'delivered' => 'Đã giao',
            'cancelled' => 'Đã hủy',
            'returned' => 'Hoàn hàng',
            'partially' => 'Mua một phần'
        ];

        $orderStatusChart = [];
        $statusColors = [
            'pending' => '#f59e0b',
            'processing' => '#3b82f6',
            'shipped' => '#06b6d4',
            'delivered' => '#10b981',
            'cancelled' => '#ef4444',
            'returned' => '#d388d0ff',
            'partially' => '#9ca3af'
        ];

        foreach ($orderStatuses as $status) {
            $key = $status->status;
            $orderStatusChart[] = [
                'name' => isset($statusMapping[$key]) ? $statusMapping[$key] : current(explode('_', $key)),
                'value' => $status->count,
                'color' => isset($statusColors[$key]) ? $statusColors[$key] : '#9ca3af',
            ];
        }

        $topProducts = OrderItem::select('product_name', DB::raw('SUM(quantity) as total_sold'))
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereBetween('orders.created_at', [$chartStart, $chartEnd])
            ->whereIn('orders.status', ['delivered', 'completed'])
            ->groupBy('product_name')
            ->orderBy('total_sold', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item, $index) {
                $colors = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ef4444'];
                return [
                    'name' => $item->product_name,
                    'sold' => (int) $item->total_sold,
                    'color' => $colors[$index] ?? '#cbd5e1'
                ];
            });

        $latestOrders = Order::with('paymentMethod')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($order) use ($statusMapping) {
                return [
                    'id' => $order->id,
                    'code' => $order->code ?? ('#' . $order->id),
                    'customer_name' => $order->customer_name,
                    'total_amount' => (float) $order->final_amount,
                    'payment_method' => $order->paymentMethod ? $order->paymentMethod->name : 'N/A',
                    'status' => $order->status,
                    'status_label' => $statusMapping[$order->status] ?? current(explode('_', $order->status)),
                ];
            });

        $lowStockProducts = Inventory::with(['variant.product', 'variant.attributes'])
            ->whereColumn('quantity', '<=', 'min_quantity')
            ->orderBy('quantity', 'asc')
            ->limit(5)
            ->get()
            ->map(function ($inventory) {
                $color = '-';
                $size = '-';
                if ($inventory->variant && $inventory->variant->attributes) {
                    foreach ($inventory->variant->attributes as $attr) {
                        $name = mb_strtolower($attr->attribute_name, 'UTF-8');
                        if (str_contains($name, 'màu') || str_contains($name, 'color')) {
                            $color = $attr->attribute_value;
                        }
                        if (str_contains($name, 'size') || str_contains($name, 'kích cỡ') || str_contains($name, 'kích thước')) {
                            $size = $attr->attribute_value;
                        }
                    }
                }
                return [
                    'id' => $inventory->id,
                    'product_name' => $inventory->variant && $inventory->variant->product ? $inventory->variant->product->name : 'N/A',
                    'sku' => $inventory->variant ? $inventory->variant->sku : 'N/A',
                    'color' => $color,
                    'size' => $size,
                    'quantity' => $inventory->quantity,
                    'min_quantity' => $inventory->min_quantity,
                ];
            });

        return response()->json([
            'is_filtered' => $isFiltered,
            'cards' => [
                'revenue_month' => $revenueMonth,
                'revenue_today' => $revenueToday,
                'total_orders' => $totalOrders,
                'pending_orders' => $pendingOrders,
                'inventory_warnings' => $inventoryWarnings,
                'reviews_today' => $reviewsToday,
            ],
            'charts' => [
                'revenue_30_days' => $revenueChart,
                'order_status' => $orderStatusChart,
                'top_products' => $topProducts,
            ],
            'latest_orders' => $latestOrders,
            'low_stock_products' => $lowStockProducts,
        ]);
    }
}
