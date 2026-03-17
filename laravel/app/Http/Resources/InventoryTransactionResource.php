<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class InventoryTransactionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'              => $this->id,
            'variant'         => $this->whenLoaded('variant', fn() => [
                'id'           => $this->variant->id,
                'name'         => $this->variant->name,
                'product_name' => $this->variant->product->name ?? null,
                'sku'          => $this->variant->sku,
            ]),
            'type'            => $this->type,
            'reference_type'  => $this->reference_type,
            'reference_id'    => $this->reference_id,
            'quantity_before' => $this->quantity_before,
            'quantity_change' => $this->quantity_change,
            'quantity_after'  => $this->quantity_after,
            'note'            => $this->note,
            'created_by'      => $this->whenLoaded('createdBy', fn() => [
                'id'   => $this->createdBy->id,
                'name' => $this->createdBy->name,
            ]),
            'created_at'      => $this->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
