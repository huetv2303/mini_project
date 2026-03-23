<?php

namespace App\Interfaces\Order;

interface OrderReturnRepositoryInterface
{
    public function getAll($request = null, $perPage = 15);
    public function findById($id);
    public function create(array $data);
}
