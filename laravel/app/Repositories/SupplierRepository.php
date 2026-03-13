<?php

namespace App\Repositories;

use App\Interfaces\SupplierRepositoryInterface;
use App\Models\Supplier;

class SupplierRepository implements SupplierRepositoryInterface
{
    public function getAll($request =null)
    {
        $query = Supplier::query();
        if ($request == null){
            return  $query->paginate(10);
        }

        return $query->when($request->search, fn($q, $v) => $q->where('name', 'like', '%'.$v.'%'))->paginate(10);
    }

    public function getBySlug($slug)
    {
        return Supplier::where('slug', $slug)->first();
    }

    public function createSupplier($data)
    {
        return Supplier::create($data);
    }

    public function updateSupplier($slug, $data)
    {
        $supplier = Supplier::where('slug', $slug)->first();
        if ($supplier) {
            $supplier->update($data);
            return $supplier;
        }
        return null;
    }

    public function deleteSupplier($slug)
    {
        $supplier = Supplier::where('slug', $slug)->first();
        if ($supplier) {
            $supplier->delete();
            return $supplier;
        }
        return false;
    }
}
