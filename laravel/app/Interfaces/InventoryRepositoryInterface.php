<?php

namespace App\Interfaces;

interface InventoryRepositoryInterface
{
    public function createInventory(array $data);
    public function updateInventory(array $data, $id);
    public function deleteInventory($slug);
    public function getAll($request = null);
    public function getBySlug($slug);
}
