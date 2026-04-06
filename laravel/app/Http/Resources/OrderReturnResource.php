<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderReturnResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'order_id'            => $this->order_id,
            'return_code'         => $this->return_code,
            'total_return_amount' => (float)$this->total_return_amount,
            'reason'              => $this->reason,
            'receive_status'      => $this->receive_status,
            'refund_status'       => $this->refund_status,
            'status'              => $this->status,
            'created_by'          => $this->created_by,
            'created_at'          => $this->created_at,
            'updated_at'          => $this->updated_at,

            'order' => new OrderResource($this->whenLoaded('order')),
            'staff' => new UserResource($this->whenLoaded('staff')),
            'items' => $this->whenLoaded('items'),
        ];
    }
}
