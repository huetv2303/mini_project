<?php

namespace App\Interfaces\Order;

use App\Models\Order;

interface OrderRepositoryInterface
{
    public function getAll($request = null);
    public function findById($id);
    public function createOrder(array $data): Order;
    public function updateOrder(array $data, $id);
}
