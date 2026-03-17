<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'code' => $this->code,
            'avatar' => $this->avatar ? asset('storage/' . $this->avatar) : null,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'gender' => $this->gender,
            'date_of_birth' => $this->date_of_birth,
            'address' => $this->address,
            'is_active' => (bool)$this->is_active,
            'total_spent' => (float)$this->total_spent,
            'total_orders' => (int)$this->total_orders,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
