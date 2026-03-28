<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'slug'              => $this->slug,
            'short_description' => $this->short_description,
            'description'       => $this->description,
            'feature_image'     => $this->feature_image
                ? asset('storage/' . $this->feature_image)
                : null,
            'image'             => $this->feature_image
                ? asset('storage/' . $this->feature_image)
                : null,
            'price'             => $this->variants->min('price'),
            'old_price'         => $this->variants->min('compare_price'),
            'category_id'       => $this->category_id,
            'status'            => $this->status,
            'sold_count'        => $this->sold_count,
            'category'          => $this->whenLoaded('category', fn() => [
                'id'   => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
            'supplier'          => $this->whenLoaded('supplier', fn() => [
                'id'   => $this->supplier->id,
                'name' => $this->supplier->name,
                'slug' => $this->supplier->slug,
            ]),
            'images' => $this->whenLoaded(
                'images',
                fn() =>
                $this->images->map(fn($img) => [
                    'id'         => $img->id,
                    'url'        => asset('storage/' . $img->image_path),
                    'is_main'    => $img->is_main,
                    'sort_order' => $img->sort_order,
                    'variant_id' => $img->variant_id,
                ])
            ),
            'attributes' => $this->whenLoaded(
                'attributes',
                fn() =>
                $this->attributes
                    ->whereNull('variant_id')
                    ->map(fn($attr) => [
                        'id'              => $attr->id,
                        'attribute_name'  => $attr->attribute_name,
                        'attribute_value' => $attr->attribute_value,
                    ])->values()
            ),
            'variants' => $this->whenLoaded(
                'variants',
                fn() =>
                $this->variants->map(fn($variant) => [
                    'id'            => $variant->id,
                    'name'          => $variant->name,
                    'sku'           => $variant->sku,
                    'price'         => $variant->price,
                    'compare_price' => $variant->compare_price,
                    'cost_price'    => $variant->cost_price,
                    'image'         => $variant->image
                        ? asset('storage/' . $variant->image)
                        : null,
                    'weight'        => $variant->weight,
                    'status'        => $variant->status,
                    'attributes'    => $variant->attributes->map(fn($attr) => [
                        'attribute_name'  => $attr->attribute_name,
                        'attribute_value' => $attr->attribute_value,
                    ]),
                    'inventory'     => $variant->inventories->first()
                        ? [
                            'quantity'     => $variant->inventories->first()->quantity,
                            'reserved'     => $variant->inventories->first()->reserved,
                            'available'    => $variant->inventories->first()->quantity - $variant->inventories->first()->reserved,
                            'min_quantity' => $variant->inventories->first()->min_quantity,
                            'unavailable'  => $variant->inventories->first()->unavailable,
                            'returning'    => $variant->inventories->first()->returning,
                            'packing'      => $variant->inventories->first()->packing,
                        ]
                        : null,
                ])
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
