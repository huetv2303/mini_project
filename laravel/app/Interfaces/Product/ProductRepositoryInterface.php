<?php

namespace App\Interfaces\Product;

interface ProductRepositoryInterface
{
    public function getAll($request = null);
    public function findBySlug($slug);
    public function findByIds(array $ids);
    public function createProduct(array $data);
    public function updateProduct(array $data, $slug);
    public function deleteProduct($slug);
}
