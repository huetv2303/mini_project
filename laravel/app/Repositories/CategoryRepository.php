<?php

namespace App\Repositories;

use App\Interfaces\CategoryRepositoryInterface;
use App\Models\Category;

class CategoryRepository implements CategoryRepositoryInterface
{
    public function findBySlug($slug)
    {
        return Category::where('slug', $slug)->first();
    }
    public function createCate(array $data)
    {
        return Category::create($data);
    }
    public function updateCate(array $data)
    {
        $category = Category::find($data['id']);
        if ($category) {
            $category->update($data);
            return $category;
        }
        return null;
    }
    public function deleteCate($slug)
    {
        $category = $this->findBySlug($slug);
        if ($category) {
            return $category->delete();
        }
        return false;
    }
    public function getAll($request = null)
    {
        $query = Category::with('parent');

        if ($request && $request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                    ->orWhere('slug', 'like', "%$search%");
            });
        }

        return $query;
    }
}
