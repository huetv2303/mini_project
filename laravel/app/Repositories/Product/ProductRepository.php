<?php

namespace App\Repositories\Product;

use App\Interfaces\Product\ProductRepositoryInterface;
use App\Models\Product;

class ProductRepository implements ProductRepositoryInterface
{
    public function getAll($request = null)
    {
        $query = Product::with(['category', 'supplier', 'images', 'attributes', 'variants.attributes', 'variants.inventories']);
        if ($request == null) {
            return  $query->paginate(10);
        }

        return $query->when($request->search, fn($q, $v) => $q->where('name', 'like', '%' . $v . '%'))->paginate(10);
    }
    public function findBySlug($slug)
    {
        return Product::where('slug', $slug)->first();
    }
    public function createProduct(array $data)
    {
        return Product::create($data);
    }
    public function updateProduct(array $data, $slug)
    {
        $product = Product::where('slug', $slug)->first();
        if ($product) {
            $product->update($data);
            return $product;
        }
        return null;
    }
    public function deleteProduct($slug)
    {
        $product = Product::where('slug', $slug)->first();
        if ($product) {
            $product->delete();
            return $product;
        }
        return false;
    }
}
