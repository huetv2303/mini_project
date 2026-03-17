<?php

namespace App\Repositories\StockReceipt;

use App\Interfaces\StockReceipt\StockReceiptRepositoryInterface;
use App\Models\StockReceipt;

class StockReceiptRepository implements StockReceiptRepositoryInterface
{
    public function getAll($request = null)
    {
        $query = StockReceipt::with(['supplier', 'staff', 'items.variant'])
            ->latest();

        if ($request && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request && $request->search) {
            $query->where('code', 'like', '%' . $request->search . '%');
        }

        return $query->paginate(10);
    }

    public function findById($id)
    {
        return StockReceipt::with(['supplier', 'staff', 'items.variant.product'])
            ->findOrFail($id);
    }

    public function create(array $data)
    {
        return StockReceipt::create($data);
    }

    public function update(array $data, $id)
    {
        $receipt = StockReceipt::findOrFail($id);
        $receipt->update($data);
        return $receipt;
    }
}
