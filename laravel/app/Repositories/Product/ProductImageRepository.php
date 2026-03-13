<?php

namespace App\Repositories\Product;

use App\Interfaces\Product\ProductImageRepositoryInterface;
use App\Models\ProductImage;

class ProductImageRepository implements ProductImageRepositoryInterface
{
    public function getAll($request = null)
    {
        $query = ProductImage::query();
        if ($request == null) {
            return $query->paginate(10);
        }
        return $query->when($request->search, fn($q, $v) => $q->where('image_path', 'like', '%' . $v . '%'))->paginate(10);
    }

    public function getBySlug($slug)
    {
        return ProductImage::find($slug);
    }

    public function createProImage(array $data)
    {
        return ProductImage::create($data);
    }

    public function updateProImage(array $data)
    {
        $image = ProductImage::find($data['id']);
        if ($image) {
            $image->update($data);
            return $image;
        }
        return null;
    }

    public function deleteProImage($id)
    {
        $image = ProductImage::find($id);
        if ($image) {
            $image->delete();
            return $image;
        }
        return false;
    }
}

