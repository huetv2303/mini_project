<?php
namespace App\Interfaces\Product;

interface ProductVariantRepositoryInterface{
    public function createProVariant(array $data);
    public function updateProVariant(array $data);
    public function deleteProVariant($slug);
    public function getAll($request = null);
    public function getBySlug($slug);
}