<?php
namespace App\Interfaces;


interface CategoryRepositoryInterface {
    public function findBySlug($slug);
    public function createCate(array $data);
    public function updateCate(array $data);
    public function deleteCate($slug);
    public function getAll($request = null);
}