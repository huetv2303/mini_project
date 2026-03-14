<?php
namespace App\Interfaces\Product;

interface ProductImageRepositoryInterface{
    public function createProImage(array $data);
    public function updateProImage(array $data, $id);
    public function deleteProImage($slug);
    public function getAll($request = null);
    public function getBySlug($slug);
}