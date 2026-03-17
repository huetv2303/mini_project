<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'sku'           => $this->sku,
            'price'         => $this->price,
            'compare_price' => $this->compare_price,
            'cost_price'    => $this->cost_price,
            'image'         => $this->image ? asset('storage/' . $this->image) : null,
            'status'        => $this->status,
            'product'       => $this->whenLoaded('product', fn() => [
                'id'   => $this->product->id,
                'name' => $this->product->name,
                'slug' => $this->product->slug,
            ]),
        ];
    }
}
