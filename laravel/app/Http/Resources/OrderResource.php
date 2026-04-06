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
            'source'           => $this->source,
            'payment_status'   => $this->payment_status,
            'total_amount'     => $this->total_amount,
            'discount_amount'  => $this->discount_amount,
            'shipping_fee'     => $this->shipping_fee,
            'fulfillment_type' => $this->fulfillment_type,
            'shipping_address' => $this->shipping_address,
            'expected_delivery_date' => $this->expected_delivery_date?->format('Y-m-d'),
            'final_amount'     => $this->final_amount,
            'tax_amount'       => $this->tax_amount,
            'tax_rate_snapshot' => $this->tax_rate_snapshot,
            'tax_rate'         => $this->whenLoaded('taxRate', fn() => [
                'id'   => $this->taxRate?->id,
                'name' => $this->taxRate?->name,
                'rate' => $this->taxRate?->rate,
            ]),
            'note'             => $this->note,
            'customer'         => [
                'name'    => $this->customer_name,
                'phone'   => $this->customer_phone,
                'address' => $this->customer_address,
            ],
            'shipping_method'  => $this->whenLoaded('shippingMethod', fn() => [
                'id'   => $this->shippingMethod?->id,
                'name' => $this->shippingMethod?->name,
                'cost' => $this->shippingMethod?->cost,
            ]),
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
            'returns'          => $this->whenLoaded('returns', fn() =>
                $this->returns->map(fn($r) => [
                    'id'                  => $r->id,
                    'return_code'         => $r->return_code,
                    'reason'              => $r->reason,
                    'status'              => $r->status,
                    'receive_status'      => $r->receive_status,
                    'refund_status'       => $r->refund_status,
                    'total_return_amount' => (float) $r->total_return_amount,
                    'created_at'          => $r->created_at?->format('Y-m-d H:i:s'),
                    'items'               => $r->items->map(fn($item) => [
                        'id'           => $item->id,
                        'order_item_id'=> $item->order_item_id,
                        'product_id'   => $item->product_id,
                        'quantity'     => $item->quantity,
                        'price'        => (float) $item->price,
                        'subtotal'     => (float) $item->subtotal,
                    ]),
                ])
            ),
        ];
    }
}
