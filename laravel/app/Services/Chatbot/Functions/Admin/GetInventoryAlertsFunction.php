<?php

namespace App\Services\Chatbot\Functions\Admin;

use App\Services\Chatbot\Functions\ChatFunctionInterface;
use Illuminate\Support\Facades\DB;

class GetInventoryAlertsFunction implements ChatFunctionInterface
{
    public function getName(): string
    {
        return 'getInventoryAlerts';
    }

    public function getDescription(): string
    {
        return 'Liệt kê DANH SÁCH CHI TIẾT các sản phẩm sắp hết hàng hoặc đã hết hàng trong kho. BẮT BUỘC dùng khi Admin hỏi về hàng hết, tồn kho thấp, hoặc cần kiểm tra tình hình kho bãi.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'threshold' => [
                    'type' => 'integer',
                    'description' => 'Ngưỡng số lượng để coi là sắp hết hàng (mặc định là 5).',
                    'default' => 5
                ]
            ]
        ];
    }

    public function execute(array $args): array
    {
        $threshold = $args['threshold'] ?? 5;

        // Truy vấn các biến thể sản phẩm có tổng tồn kho thấp
        $lowStockItems = DB::table('product_variants')
            ->join('products', 'product_variants.product_id', '=', 'products.id')
            ->join('inventories', 'product_variants.id', '=', 'inventories.variant_id')
            ->select(
                'products.name as product_name',
                'product_variants.name as variant_name',
                'product_variants.sku',
                DB::raw('SUM(inventories.quantity) as total_stock')
            )
            ->groupBy('product_variants.id', 'products.name', 'product_variants.name', 'product_variants.sku')
            ->having(DB::raw('SUM(inventories.quantity)'), '<=', $threshold)
            ->orderBy('total_stock', 'asc')
            ->limit(20)
            ->get();

        return [
            'threshold_used' => $threshold,
            'alert_count' => $lowStockItems->count(),
            'items' => $lowStockItems->toArray()
        ];
    }
}
