<?php

namespace App\Repositories;

use App\Interfaces\InventoryRepositoryInterface;
use App\Models\Inventory;

class InventoryRepository implements InventoryRepositoryInterface
{
    public function getAll($request = null)
    {
        $query = Inventory::query();
        if ($request == null) {
            return  $query->paginate(10);
        }

        return $query->when($request->search, fn($q, $v) => $q->where('name', 'like', '%' . $v . '%'))->paginate(10);
    }
    public function getBySlug($slug)
    {
        return Inventory::where('slug', $slug)->first();
    }
    public function createInventory(array $data)
    {
        return Inventory::create($data);
    }
    public function updateInventory(array $data)
    {
        $product = Inventory::where('slug', $data['slug'])->first();
        if ($product) {
            $product->update($data);
            return $product;
        }
        return null;
    }
    public function deleteInventory($slug)
    {
        $product = Inventory::where('slug', $slug)->first();
        if ($product) {
            $product->delete();
            return $product;
        }
        return false;
    }
}
