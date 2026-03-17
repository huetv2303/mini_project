<?php

namespace App\Interfaces;

use Illuminate\Database\Eloquent\Model;

interface StockReceiptRepositoryInterface
{
    public function getAll();
    public function getById($id);
    public function create(array $data);
    public function update(array $data, $id);
    public function delete($id);
}
