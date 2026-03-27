<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerProfileResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'user_id'       => $this->user_id,
            'phone'         => $this->phone,
            'gender'        => $this->gender,
            'date_of_birth' => $this->date_of_birth,
            'address'       => $this->address,
            'loyalty_tier'  => $this->loyalty_tier,
            'total_spent'   => $this->total_spent,
            'total_orders'  => $this->total_orders,
        ];
    }
}
