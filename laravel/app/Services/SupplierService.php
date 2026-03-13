<?php
namespace App\Services;

use App\Interfaces\SupplierRepositoryInterface;

class SupplierService {
    protected $supplier;
    public function __construct(SupplierRepositoryInterface $supplier){
        $this->supplier = $supplier;
    }

    public function createSupplier(array $data){
        return $this->supplier->createSupplier($data);
    }

    public function updateSupplier(string $slug, array $data){
        return $this->supplier->updateSupplier($slug, $data);
    }

    public function deleteSupplier(string $slug){
        return $this->supplier->deleteSupplier($slug);
    }

    public function getAll($query = null){
        return $this->supplier->getAll($query);
    }

    public function getBySlug(string $slug){
        return $this->supplier->getBySlug($slug);
    }
}