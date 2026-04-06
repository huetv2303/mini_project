<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Request;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'email'             => $this->email,
            'role_id'           => $this->role_id,
            'role'              => new RoleResource($this->whenLoaded('role')),
            'customer_profile'  => new CustomerProfileResource($this->whenLoaded('customerProfile')),
            'avatar'            => $this->avatar,
            'has_password'      => !is_null($this->password),
            'email_verified_at' => $this->email_verified_at,
            'created_at'        => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at'        => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
