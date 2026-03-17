<?php
namespace App\Repositories;
use App\Interfaces\CategoryRepositoryInterface;
use App\Models\Category;

class CategoryRepository implements CategoryRepositoryInterface{
    public function findBySlug($slug){
        return Category::where('slug', $slug)->first();
    }
    public function createCate(array $data){
        return Category::create($data);
    }
    public function updateCate(array $data){
        $category = Category::find($data['id']);
        if ($category) {
            $category->update($data);
            return $category;
        }
        return null;
    }
    public function deleteCate($slug){
        $category = $this->findBySlug($slug);
        if ($category) {
            return $category->delete();
        }
        return false;
    }
    public function getAll($request = null){
        return Category::with('parent');
    }
}