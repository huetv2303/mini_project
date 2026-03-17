<?php

namespace App\Repositories;

use App\Interfaces\StockReceiptRepositoryInterface;
use App\Models\StockReceipt;

class StockReceiptRepository implements StockReceiptRepositoryInterface
{
    public function getAll()
    {
        return StockReceipt::with('items')->get();
    }

    public function getById($id)
    {
        return StockReceipt::with('items')->find($id);
    }

    public function create(array $data)
    {
        return StockReceipt::create($data);
    }

    public function update(array $data, $id)
    {
        $stockReceipt = StockReceipt::find($id);
        $stockReceipt->update($data);
        return $stockReceipt;
    }

    public function delete($id)
    {
        $stockReceipt = StockReceipt::find($id);
        $stockReceipt->delete();
        return $stockReceipt;
    }
}
