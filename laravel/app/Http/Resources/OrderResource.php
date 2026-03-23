<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'               => $this->id,
            'code'             => $this->code,
            'status'           => $this->status,
            'payment_status'   => $this->payment_status,
            'total_amount'     => $this->total_amount,
            'discount_amount'  => $this->discount_amount,
            'final_amount'     => $this->final_amount,
            'note'             => $this->note,
            'customer'         => [
                'name'    => $this->customer_name,
                'phone'   => $this->customer_phone,
                'address' => $this->customer_address,
            ],
            'payment_method'   => $this->whenLoaded('paymentMethod', fn() => [
                'id'   => $this->paymentMethod?->id,
                'name' => $this->paymentMethod?->name,
                'code' => $this->paymentMethod?->code,
            ]),
            'created_by'       => $this->whenLoaded('staff', fn() => [
                'id'   => $this->staff?->id,
                'name' => $this->staff?->name,
                'avatar' => $this->staff?->avatar,
            ]),
            'items'            => $this->whenLoaded(
                'items',
                fn() =>
                $this->items->map(fn($item) => [
                    'id'           => $item->id,
                    'product_id'   => $item->product_id,
                    'variant_id'   => $item->product_variant_id,
                    'image'        => $item->image
                        ? asset('storage/' . $item->image)
                        : ($item->variant?->image
                            ? asset('storage/' . $item->variant->image)
                            : ($item->product?->feature_image
                                ? asset('storage/' . $item->product->feature_image)
                                : null)
                        ),
                    'product_name' => $item->product_name,
                    'variant_name' => $item->variant_name,
                    'sku'          => $item->sku,
                    'price'        => $item->price,
                    'quantity'     => $item->quantity,
                    'returned_quantity' => $item->returnItems->sum('quantity'),
                    'subtotal'     => $item->subtotal,
                ])
            ),
            'created_at'       => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at'       => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
