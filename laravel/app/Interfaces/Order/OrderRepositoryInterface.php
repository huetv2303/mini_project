<?php

namespace App\Interfaces\Order;

use App\Models\Order;

interface OrderRepositoryInterface
{
    public function getAll($request = null, $perPage = 15);
    public function findById($id);
    public function createOrder(array $data): Order;
    public function updateOrder(array $data, $id);
}
