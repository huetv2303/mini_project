<?php
namespace App\Interfaces\Product;
interface ProductAttributeRepositoryInterface{
    public function createProAttribute(array $data);
    public function updateProAttribute(array $data);
    public function deleteProAttribute($slug);
    public function getAll($request = null);
    public function getBySlug($slug);
}