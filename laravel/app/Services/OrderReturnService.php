<?php

namespace App\Services;

use App\Interfaces\Order\OrderRepositoryInterface;
use App\Interfaces\Order\OrderReturnRepositoryInterface;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderReturnService
{
    protected $orderRepo;
    protected $orderReturnRepo;
    protected $inventoryService;

    public function __construct(
        OrderRepositoryInterface $orderRepo,
        OrderReturnRepositoryInterface $orderReturnRepo,
        InventoryService $inventoryService
    ) {
        $this->orderRepo = $orderRepo;
        $this->orderReturnRepo = $orderReturnRepo;
        $this->inventoryService = $inventoryService;
    }

    public function getAll($request = null)
    {
        return $this->orderReturnRepo->getAll($request, 5);
    }

    public function findById($id)
    {
        return $this->orderReturnRepo->findById($id);
    }

    public function processReturn(array $data, $userId)
    {
        return DB::transaction(function () use ($data, $userId) {
            $order = $this->orderRepo->findById($data['order_id']);

            if (!in_array($order->status, ['delivered', 'partially_returned'])) {
                throw new \Exception('Chỉ có thể trả hàng cho đơn hàng đã giao thành công.');
            }

            $returnCode = 'RET-' . date('Ymd') . '-' . strtoupper(Str::random(5));

            $refundStatus = ($order->payment_status === 'paid' || $order->payment_status === 'partially_refunded')
                ? 'pending'
                : 'not_needed';

            $orderReturn = $this->orderReturnRepo->create([
                'order_id'            => $order->id,
                'return_code'         => $returnCode,
                'total_return_amount' => 0,
                'reason'              => $data['reason'] ?? null,
                'receive_status'      => 'pending',
                'refund_status'       => $refundStatus,
                'status'              => 'returning',
                'created_by'          => $userId,
            ]);

            $totalReturnAmount = 0;

            foreach ($data['items'] as $itemData) {
                $orderItem = $order->items()->where('id', $itemData['order_item_id'])->firstOrFail();

                $alreadyReturned = $order->returns()
                    ->join('order_return_items', 'order_returns.id', '=', 'order_return_items.order_return_id')
                    ->where('order_return_items.order_item_id', $orderItem->id)
                    ->sum('order_return_items.quantity');

                if ($itemData['quantity'] > ($orderItem->quantity - $alreadyReturned)) {
                    throw new \Exception("Số lượng trả cho sản phẩm {$orderItem->product_name} vượt quá số lượng còn lại có thể trả.");
                }

                $subtotal = $orderItem->price * $itemData['quantity'];
                $totalReturnAmount += $subtotal;

                $orderReturn->items()->create([
                    'order_item_id'      => $orderItem->id,
                    'product_id'         => $orderItem->product_id,
                    'product_variant_id' => $orderItem->product_variant_id,
                    'quantity'           => $itemData['quantity'],
                    'price'              => $orderItem->price,
                    'subtotal'           => $subtotal,
                ]);
            }

            $orderReturn->update(['total_return_amount' => $totalReturnAmount]);

            foreach ($orderReturn->items as $item) {
                if ($item->product_variant_id) {
                    $this->inventoryService->updateReturningStock($item->product_variant_id, $item->quantity, true);
                }
            }

            return $orderReturn->load(['order', 'staff', 'items.orderItem']);
        });
    }

    public function receiveStock($id, $userId)
    {
        return DB::transaction(function () use ($id, $userId) {
            $orderReturn = $this->findById($id);

            if ($orderReturn->receive_status === 'received') {
                throw new \Exception('Sản phẩm đã được nhận và hoàn kho trước đó.');
            }

            foreach ($orderReturn->items as $item) {
                if ($item->product_variant_id) {
                    $this->inventoryService->increaseStock(
                        $item->product_variant_id,
                        $item->quantity,
                        'return',
                        $orderReturn->id,
                        $userId,
                        "Nhập kho từ trả hàng đơn hàng: " . $orderReturn->order->code,
                        'order_return'
                    );

                    $this->inventoryService->updateReturningStock($item->product_variant_id, $item->quantity, false);
                }

                if ($item->product_id) {
                    Product::where('id', $item->product_id)
                        ->decrement('sold_count', $item->quantity);
                }
            }

            $orderReturn->update(['receive_status' => 'received']);

            if ($orderReturn->refund_status === 'refunded' || $orderReturn->refund_status === 'not_needed') {
                $orderReturn->update(['status' => 'completed']);
            }

            $this->updateOrderStatuses($orderReturn->order);

            return $orderReturn->load(['order', 'staff', 'items.orderItem']);
        });
    }

    public function refundMoney($id, $userId)
    {
        return DB::transaction(function () use ($id, $userId) {
            $orderReturn = $this->findById($id);

            if ($orderReturn->refund_status === 'refunded') {
                throw new \Exception('Đã hoàn tiền cho phiếu trả hàng này.');
            }

            if ($orderReturn->refund_status === 'not_needed') {
                throw new \Exception('Đơn hàng này chưa thanh toán nên không cần hoàn tiền.');
            }

            $orderReturn->update(['refund_status' => 'refunded']);

            if ($orderReturn->receive_status === 'received') {
                $orderReturn->update(['status' => 'completed']);
            }

            $this->updateOrderStatuses($orderReturn->order);

            return $orderReturn->load(['order', 'staff', 'items.orderItem']);
        });
    }

    public function bulkRefund(array $ids, $userId)
    {
        $updatedCount = 0;
        foreach ($ids as $id) {
            try {
                $orderReturn = $this->findById($id);
                if ($orderReturn->refund_status === 'refunded' || $orderReturn->refund_status === 'not_needed') {
                    continue;
                }
                $this->refundMoney($id, $userId);
                $updatedCount++;
            } catch (\Exception $e) {
                continue;
            }
        }
        return $updatedCount;
    }

    protected function updateOrderStatuses($order)
    {
        $totalOrderedItems = $order->items()->sum('quantity');
        $totalReturnedItems = DB::table('order_return_items')
            ->whereIn('order_return_id', $order->returns()->pluck('id'))
            ->join('order_returns', 'order_return_items.order_return_id', '=', 'order_returns.id')
            ->where('order_returns.receive_status', 'received')
            ->sum('order_return_items.quantity');

        if ($totalReturnedItems <= 0) return;

        $newOrderStatus = ($totalReturnedItems >= $totalOrderedItems) ? 'returned' : 'partially_returned';

        $totalRefundedItems = DB::table('order_return_items')
            ->whereIn('order_return_id', $order->returns()->pluck('id'))
            ->join('order_returns', 'order_return_items.order_return_id', '=', 'order_returns.id')
            ->where('order_returns.refund_status', 'refunded')
            ->sum('order_return_items.quantity');

        $newPaymentStatus = $order->payment_status;
        if ($totalRefundedItems >= $totalOrderedItems) {
            $newPaymentStatus = 'refunded';
        } elseif ($totalRefundedItems > 0) {
            $newPaymentStatus = 'partially_refunded';
        }

        $order->update([
            'status' => $newOrderStatus,
            'payment_status' => $newPaymentStatus
        ]);
    }
}
