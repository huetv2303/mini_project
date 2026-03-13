<?php

namespace App\Repositories\Product;

use App\Interfaces\Product\ProductAttributeRepositoryInterface;
use App\Models\ProductAttribute;

class ProductAttributeRepository implements ProductAttributeRepositoryInterface
{
    public function getAll($request = null)
    {
        $query = ProductAttribute::query();
        if ($request == null) {
            return $query->paginate(10);
        }
        return $query->when($request->search, fn($q, $v) => $q->where('attribute_name', 'like', '%' . $v . '%'))->paginate(10);
    }

    public function getBySlug($slug)
    {
        return ProductAttribute::find($slug);
    }

    public function createProAttribute(array $data)
    {
        return ProductAttribute::create($data);
    }

    public function updateProAttribute(array $data)
    {
        $attr = ProductAttribute::find($data['id']);
        if ($attr) {
            $attr->update($data);
            return $attr;
        }
        return null;
    }

    public function deleteProAttribute($id)
    {
        $attr = ProductAttribute::find($id);
        if ($attr) {
            $attr->delete();
            return $attr;
        }
        return false;
    }
}

