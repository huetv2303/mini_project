<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'slug'        => $this->slug,
            'image'       => $this->image,
            'description' => $this->description,
            'status'      => $this->status,
            'level'       => $this->level,
            'sort_order'  => $this->sort_order,
            'is_featured' => $this->is_featured,
            'parent'      => new CategoryResource($this->whenLoaded('parent')),
            'created_at'  => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at'  => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
