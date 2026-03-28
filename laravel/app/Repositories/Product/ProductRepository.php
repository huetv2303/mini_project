<?php

namespace App\Repositories\Product;

use App\Interfaces\Product\ProductRepositoryInterface;
use App\Models\Product;

class ProductRepository implements ProductRepositoryInterface
{
    public function getAll($request = null)
    {
        $query = Product::with(['category', 'supplier', 'images', 'attributes', 'variants.attributes', 'variants.inventories']);
        
        if ($request) {
            if ($request->search) {
                $query->where('name', 'like', '%' . $request->search . '%');
            }
            if ($request->category) {
                // Find all category IDs including descendants
                $category = \App\Models\Category::where('slug', $request->category)->first();
                if ($category) {
                    $categoryIds = $this->getAllCategoryIds($category);
                    $query->whereIn('category_id', $categoryIds);
                }
            }
            if ($request->sort) {
                if ($request->sort === 'latest') $query->latest();
                if ($request->sort === 'price_low') {
                    // This is complex because price is in variants. 
                    // Let's just do a simple fallback for now or leave it.
                }
            }
        }

        $limit = $request->limit ?? 15;
        return $query->paginate($limit);
    }
    public function findBySlug($slug)
    {
        return Product::where('slug', $slug)->first();
    }
    public function findByIds(array $ids)
    {
        return Product::whereIn('id', $ids)->get();
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

    public function search($query)
    {
        return Product::with(['images', 'variants.inventories', 'variants.attributes'])
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', '%' . $query . '%')
                    ->orWhereHas('variants', function ($v) use ($query) {
                        $v->where('sku', 'like', '%' . $query . '%');
                    });
            })
            ->get();
    }

    public function getBySku($sku)
    {
        return Product::with(['images', 'variants.inventories', 'variants.attributes'])
            ->whereHas('variants', function ($q) use ($sku) {
                $q->where('sku', $sku);
            })
            ->first();
    }

    private function getAllCategoryIds($category)
    {
        $ids = [$category->id];
        foreach ($category->children as $child) {
            $ids = array_merge($ids, $this->getAllCategoryIds($child));
        }
        return $ids;
    }
}
