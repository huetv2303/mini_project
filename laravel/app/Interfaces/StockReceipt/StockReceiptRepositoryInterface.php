<?php

namespace App\Interfaces\StockReceipt;

interface StockReceiptRepositoryInterface
{
    public function getAll($request = null);
    public function findById($id);
    public function create(array $data);
    public function update(array $data, $id);
}
