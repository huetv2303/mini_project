<?php
namespace App\Services;

use App\Interfaces\CategoryRepositoryInterface;

class CategoryService {
    protected $cateRepo;
    public function __construct(CategoryRepositoryInterface $cateRepo){
        $this->cateRepo = $cateRepo;
    }
    public function findBySlug($slug){
        return $this->cateRepo->findBySlug($slug);
    }
    public function createCate(array $data){
        return $this->cateRepo->createCate($data);
    }
    public function updateCate(array $data){
        return $this->cateRepo->updateCate($data);
    }
    public function deleteCate($slug){
        return $this->cateRepo->deleteCate($slug);
    }
    public function getAll($request = null){
        return $this->cateRepo->getAll($request);
    }
}