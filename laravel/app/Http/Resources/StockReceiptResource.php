<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class StockReceiptResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->id,
            'code'         => $this->code,
            'status'       => $this->status,
            'total_amount' => $this->total_amount,
            'note'         => $this->note,
            'received_at'  => $this->received_at?->format('Y-m-d H:i:s'),
            'supplier'     => [
                'id'   => $this->supplier_id,
                'name' => $this->supplier?->name,
            ],
            'created_by'   => [
                'id'   => $this->user_id,
                'name' => $this->staff?->name,
            ],
            'items'        => StockReceiptItemResource::collection($this->whenLoaded('items')),
            'created_at'   => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at'   => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
