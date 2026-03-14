<?php

namespace App\Repositories\Product;

use App\Interfaces\Product\ProductVariantRepositoryInterface;
use App\Models\ProductVariant;

class ProductVariantRepository implements ProductVariantRepositoryInterface
{
    public function getAll($request = null)
    {
        $query = ProductVariant::query();
        if ($request == null) {
            return $query->paginate(10);
        }
        return $query->when($request->search, fn($q, $v) => $q->where('name', 'like', '%' . $v . '%'))->paginate(10);
    }

    public function getBySlug($slug)
    {
        return ProductVariant::where('sku', $slug)->first();
    }

    public function createProVariant(array $data)
    {
        return ProductVariant::create($data);
    }

    public function updateProVariant(array $data, $id)
    {
        $variant = ProductVariant::find($id);
        if ($variant) {
            $variant->update($data);
            return $variant;
        }
        return null;
    }

    public function deleteProVariant($slug)
    {
        $variant = ProductVariant::where('sku', $slug)->first();
        if ($variant) {
            $variant->delete();
            return $variant;
        }
        return false;
    }
}

