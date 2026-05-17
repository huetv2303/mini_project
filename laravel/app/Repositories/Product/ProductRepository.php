<?php

namespace App\Repositories\Product;

use App\Interfaces\Product\ProductRepositoryInterface;
use App\Models\Category;
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
                $category = Category::where('slug', $request->category)->first();
                if ($category) {
                    $categoryIds = $this->getAllCategoryIds($category);
                    $query->whereIn('category_id', $categoryIds);
                }
            }
            if ($request->min_price !== null && $request->min_price !== '') {
                $query->whereHas('variants', function ($q) use ($request) {
                    $q->where('price', '>=', $request->min_price);
                });
            }
            if ($request->max_price !== null && $request->max_price !== '') {
                $query->whereHas('variants', function ($q) use ($request) {
                    $q->where('price', '<=', $request->max_price);
                });
            }
            if ($request->rating !== null && $request->rating !== '') {
                $ratingThreshold = intval($request->rating);
                $query->where(function ($sub) {
                    $sub->selectRaw('AVG(rating)')
                        ->from('comments')
                        ->whereColumn('product_id', 'products.id');
                }, '>=', $ratingThreshold);
            }
            if ($request->sort) {
                if ($request->sort === 'latest') {
                    $query->latest();
                } elseif ($request->sort === 'price_low') {
                    $query->orderBy(
                        \App\Models\ProductVariant::selectRaw('MIN(price)')
                            ->whereColumn('product_id', 'products.id')
                            ->limit(1),
                        'asc'
                    );
                } elseif ($request->sort === 'price_high') {
                    $query->orderBy(
                        \App\Models\ProductVariant::selectRaw('MIN(price)')
                            ->whereColumn('product_id', 'products.id')
                            ->limit(1),
                        'desc'
                    );
                } elseif ($request->sort === 'popular') {
                    $query->orderBy('sold_count', 'desc');
                }
            } else {
                $query->latest();
            }
        } else {
            $query->latest();
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
        $qBuilder = Product::with(['images', 'variants.inventories', 'variants.attributes'])
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', '%' . $query . '%')
                    ->orWhereHas('variants', function ($v) use ($query) {
                        $v->where('sku', 'like', '%' . $query . '%');
                    });
            });

        if (empty($query)) {
            $qBuilder->limit(50);
        }

        return $qBuilder->get();
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
