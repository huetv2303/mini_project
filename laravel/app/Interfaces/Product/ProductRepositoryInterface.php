<?php
namespace App\Interfaces\Product;

interface ProductRepositoryInterface{
    public function getAll($request = null); 
    public function findBySlug($slug);
    public function createProduct(array $data);
    public function updateProduct(array $data);
    public function deleteProduct($slug);
}