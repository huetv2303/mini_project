<?php

namespace App\Repositories\Order;

use App\Interfaces\Order\OrderRepositoryInterface;
use App\Models\Order;

class OrderRepository implements OrderRepositoryInterface
{
    public function getAll($request = null, $perPage = 15)
    {
        $query = Order::with(['paymentMethod', 'staff', 'items']);

        if ($request) {
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
            if ($request->filled('search')) {
                $query->where('code', 'like', '%' . $request->search . '%')
                    ->orWhere('customer_name', 'like', '%' . $request->search . '%')
                    ->orWhere('customer_phone', 'like', '%' . $request->search . '%');
            }
        }

        return $query->latest()->paginate($perPage);
    }

    public function findById($id)
    {
        return Order::with(['paymentMethod', 'staff', 'items.variant', 'items.product', 'items.returnItems'])->findOrFail($id);
    }

    public function createOrder(array $data): Order
    {
        return Order::create($data);
    }

    public function updateOrder(array $data, $id)
    {
        $order = Order::findOrFail($id);
        $order->update($data);
        return $order;
    }
}
