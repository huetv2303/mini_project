<?php

namespace App\Interfaces;

interface SupplierRepositoryInterface
{
    public function getAll($request = null);
    public function getBySlug($slug);
    public function createSupplier($data);
    public function updateSupplier($slug, $data);
    public function deleteSupplier($slug);
}
