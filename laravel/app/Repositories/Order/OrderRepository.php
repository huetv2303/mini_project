<?php

namespace App\Repositories\Order;

use App\Interfaces\Order\OrderRepositoryInterface;
use App\Models\Order;

class OrderRepository implements OrderRepositoryInterface
{
    public function getAll($request = null, $perPage = 15)
    {
        $query = Order::with(['paymentMethod', 'shippingMethod', 'staff', 'items', 'taxRate', 'customer.customerProfile']);

        if ($request) {
            if ($request->filled('customer_id')) {
                $query->where('customer_id', $request->customer_id);
            }

            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            if ($request->filled('payment_status') && $request->payment_status !== 'all') {
                $query->where('payment_status', $request->payment_status);
            }

            if ($request->filled('source') && $request->source !== 'all') {
                $query->where('source', $request->source);
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $searchType = $request->query('search_type', 'all');

                $query->where(function ($q) use ($search, $searchType) {
                    switch ($searchType) {
                        case 'code':
                            $q->where('code', 'like', "%{$search}%");
                            break;
                        case 'phone':
                            $q->where('customer_phone', 'like', "%{$search}%");
                            break;
                        case 'name':
                            $q->where('customer_name', 'like', "%{$search}%");
                            break;
                        default:
                            $q->where('code', 'like', "%{$search}%")
                                ->orWhere('customer_name', 'like', "%{$search}%")
                                ->orWhere('customer_phone', 'like', "%{$search}%");
                            break;
                    }
                });
            }

            if ($request->filled('from_date')) {
                $query->whereDate('created_at', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('created_at', '<=', $request->to_date);
            }
        }

        $perPage = $request ? $request->query('per_page', 15) : 15;
        return $query->latest()->paginate($perPage);
    }

    public function findById($id)
    {
        return Order::with(['paymentMethod', 'shippingMethod', 'staff', 'items.variant', 'items.product', 'items.returnItems', 'taxRate', 'customer.customerProfile'])->findOrFail($id);
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
