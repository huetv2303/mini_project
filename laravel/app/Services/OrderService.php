<?php

namespace App\Services;

use App\Interfaces\Order\OrderRepositoryInterface;
use App\Models\Inventory;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use \Illuminate\Support\Str;

class OrderService
{
    protected $orderRepo;
    protected $inventoryService;

    public function __construct(
        OrderRepositoryInterface $orderRepo,
        InventoryService $inventoryService
    ) {
        $this->orderRepo = $orderRepo;
        $this->inventoryService = $inventoryService;
    }

    public function getAll($request = null)
    {
        return $this->orderRepo->getAll($request);
    }

    public function findById($id)
    {
        return $this->orderRepo->findById($id);
    }

    public function createOrder(array $data, $staffId)
    {
        return DB::transaction(function () use ($data, $staffId) {
            $items = $data['items'];
            $totalAmount = 0;
            $preparedItems = [];

            foreach ($items as $item) {
                $variant = ProductVariant::with('product')->findOrFail($item['product_variant_id']);

                // Kiểm tra tồn kho
                $inventory = Inventory::where('variant_id', $variant->id)->first();
                $available = $inventory ? $inventory->quantity : 0;
                if ($available < $item['quantity']) {
                    throw new \Exception(
                        "Biến thể \"{$variant->name}\" không đủ tồn kho. Hiện có: {$available}, yêu cầu: {$item['quantity']}."
                    );
                }

                $price    = $variant->price;
                $subtotal = $price * $item['quantity'];
                $totalAmount += $subtotal;

                $preparedItems[] = [
                    'product_id'         => $variant->product_id,
                    'product_variant_id' => $variant->id,
                    'product_name'       => $variant->product->name,
                    'variant_name'       => $variant->name,
                    'sku'                => $variant->sku,
                    'price'              => $price,
                    'quantity'           => $item['quantity'],
                    'subtotal'           => $subtotal,
                ];
            }

            $discountAmount = $data['discount_amount'] ?? 0;
            $finalAmount    = max(0, $totalAmount - $discountAmount);

            $code = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(5));

            $order = $this->orderRepo->createOrder([
                'code'               => $code,
                'payment_method_id'  => $data['payment_method_id'],
                'created_by'         => $staffId,
                'status'             => 'pending',
                'total_amount'       => $totalAmount,
                'discount_amount'    => $discountAmount,
                'final_amount'       => $finalAmount,
                'payment_status'     => 'unpaid',
                'note'               => $data['note'] ?? null,
                'customer_name'      => $data['customer_name'],
                'customer_phone'     => $data['customer_phone'],
                'customer_address'   => $data['customer_address'],
            ]);

            // Tạo OrderItemsx
            foreach ($preparedItems as $itemData) {
                $order->items()->create($itemData);
            }

            // Trừ tồn kho qua InventoryService
            foreach ($items as $item) {
                $this->inventoryService->decreaseStock(
                    $item['product_variant_id'],
                    $item['quantity'],
                    'order',
                    $order->id,
                    $staffId,
                    "Xuất kho cho đơn hàng: " . $order->code
                );
            }

            return $order->load(['paymentMethod', 'staff', 'items']);
        });
    }

    public function updateOrder($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $order = $this->orderRepo->findById($id);
            $oldStatus = $order->status;
            $newStatus = $data['status'] ?? $oldStatus;

            if ($oldStatus === 'cancelled') {
                throw new \Exception('Không thể cập nhật đơn hàng đã bị hủy.');
            }

            if ($newStatus === 'cancelled' && $oldStatus === 'shipped') {
                throw new \Exception('Không thể hủy đơn hàng đang vận chuyển. Vui lòng dùng endpoint /cancel.');
            }

            $updated = $this->orderRepo->updateOrder($data, $id);

            // Tăng sold_count khi đơn chuyển sang 'delivered'
            if ($oldStatus !== 'delivered' && $newStatus === 'delivered') {
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        Product::where('id', $item->product_id)
                            ->increment('sold_count', $item->quantity);
                    }
                }
            }

            // Xử lý khi status chuyển sang 'cancelled'
            if ($oldStatus !== 'cancelled' && $newStatus === 'cancelled') {
                // Hoàn lại tồn kho qua InventoryService
                foreach ($order->items as $item) {
                    if ($item->product_variant_id) {
                        $this->inventoryService->increaseStock(
                            $item->product_variant_id,
                            $item->quantity,
                            'order_cancel',
                            $order->id,
                            auth()->id(),
                            "Hoàn kho do huỷ đơn hàng: " . $order->code
                        );
                    }
                }
                // Nếu đơn đã delivered thì giảm sold_count lại
                if ($oldStatus === 'delivered') {
                    foreach ($order->items as $item) {
                        if ($item->product_id) {
                            Product::where('id', $item->product_id)
                                ->decrement('sold_count', $item->quantity);
                        }
                    }
                }
            }

            return $updated;
        });
    }


    public function cancelOrder($id)
    {
        return DB::transaction(function () use ($id) {
            $order = $this->orderRepo->findById($id);
            $previousStatus = $order->status;

            if ($previousStatus === 'cancelled') {
                throw new \Exception('Đơn hàng này đã bị hủy trước đó.');
            }

            if ($previousStatus === 'shipped') {
                throw new \Exception('Không thể hủy đơn hàng đang trong quá trình vận chuyển.');
            }

            // Hoàn lại tồn kho qua InventoryService
            foreach ($order->items as $item) {
                if ($item->product_variant_id) {
                    $this->inventoryService->increaseStock(
                        $item->product_variant_id,
                        $item->quantity,
                        'order_cancel',
                        $order->id,
                        auth()->id(),
                        "Hoàn kho do huỷ đơn hàng: " . $order->code
                    );
                }
            }

            // Nếu đơn đã 'delivered' thì giảm sold_count lại
            if ($previousStatus === 'delivered') {
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        Product::where('id', $item->product_id)
                            ->decrement('sold_count', $item->quantity);
                    }
                }
            }

            $order->update(['status' => 'cancelled']);

            return $order;
        });
    }
}
