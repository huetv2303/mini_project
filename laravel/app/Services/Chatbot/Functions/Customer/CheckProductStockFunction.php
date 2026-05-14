<?php

namespace App\Services\Chatbot\Functions\Customer;

use App\Services\Chatbot\Functions\ChatFunctionInterface;
use App\Models\Product;

class CheckProductStockFunction implements ChatFunctionInterface
{
    public function getName(): string
    {
        return 'checkProductStock';
    }

    public function getDescription(): string
    {
        return 'Kiểm tra tồn kho chi tiết (số lượng, size, màu sắc) của một sản phẩm cụ thể. Cần dùng khi khách hỏi sản phẩm này còn size M không, còn màu đỏ không, v.v.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'product_slug' => [
                    'type' => 'string',
                    'description' => 'Slug hoặc một phần tên của sản phẩm cần kiểm tra tồn kho.'
                ]
            ],
            'required' => ['product_slug']
        ];
    }

    public function execute(array $args): array
    {
        $slug = $args['product_slug'] ?? '';
        
        if (!$slug) {
            return ['error' => 'Thiếu thông tin product_slug'];
        }

        // Tìm sản phẩm
        $product = Product::where('slug', $slug)
                    ->orWhere('name', 'like', "%{$slug}%")
                    ->with(['variants.attributes', 'variants.inventories'])
                    ->first();

        if (!$product) {
            return ['message' => "Không tìm thấy sản phẩm nào có tên/slug là '{$slug}'."];
        }

        $totalStock = 0;
        $availableOptions = [];

        foreach ($product->variants as $variant) {
            $stock = $variant->inventories->sum('quantity');
            $totalStock += $stock;

            if ($stock > 0) {
                $attrs = $variant->attributes->map(function($a) {
                    return $a->attribute_value;
                })->implode(' - ');
                
                $availableOptions[] = [
                    'attributes' => $attrs ?: 'Mặc định',
                    'stock' => $stock
                ];
            }
        }

        return [
            'product_name' => $product->name,
            'is_in_stock' => $totalStock > 0,
            'total_stock' => $totalStock,
            'available_options' => $availableOptions,
            'link' => "/products/{$product->slug}"
        ];
    }
}
