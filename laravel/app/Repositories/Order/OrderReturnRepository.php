<?php

namespace App\Repositories\Order;

use App\Interfaces\Order\OrderReturnRepositoryInterface;
use App\Models\OrderReturn;

class OrderReturnRepository implements OrderReturnRepositoryInterface
{
    public function getAll($request = null, $perPage = 15)
    {
        $query = OrderReturn::with(['order', 'staff', 'items.orderItem']);

        if ($request) {
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
            if ($request->filled('search')) {
                $query->where('return_code', 'like', '%' . $request->search . '%')
                      ->orWhereHas('order', function($q) use ($request) {
                          $q->where('code', 'like', '%' . $request->search . '%');
                      });
            }
        }

        return $query->latest()->paginate($perPage);
    }

    public function findById($id)
    {
        return OrderReturn::with(['order', 'staff', 'items.orderItem', 'items.variant.product'])->findOrFail($id);
    }

    public function create(array $data)
    {
        return OrderReturn::create($data);
    }
}
