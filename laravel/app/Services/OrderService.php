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
            $reserved = 0;

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
                $reserved += $item['quantity'];
                $preparedItems[] = [
                    'product_id'         => $variant->product_id,
                    'product_variant_id' => $variant->id,
                    'product_name'       => $variant->product->name,
                    'variant_name'       => $variant->name,
                    'image'              => $this->getItemImage($variant),
                    'sku'                => $variant->sku,
                    'price'              => $price,
                    'quantity'           => $item['quantity'],
                    'subtotal'           => $subtotal,
                ];
            }

            // Tính phí vận chuyển và ngày dự kiến
            $shippingMethod = \App\Models\ShippingMethod::findOrFail($data['shipping_method_id']);
            $shippingFee = $shippingMethod->cost;
            $expectedDeliveryDate = now()->addDays($shippingMethod->estimated_days)->format('Y-m-d');

            $discountAmount = $data['discount_amount'] ?? 0;
            
            // Tính thuế
            $taxRateId = $data['tax_rate_id'] ?? null;
            $taxRateSnapshot = 0;
            $taxAmount = 0;
            if ($taxRateId) {
                $taxRate = \App\Models\TaxRate::find($taxRateId);
                if ($taxRate) {
                    $taxRateSnapshot = $taxRate->rate;
                    $taxAmount = ($totalAmount - $discountAmount) * ($taxRateSnapshot / 100);
                }
            }

            $finalAmount = max(0, ($totalAmount - $discountAmount) + $taxAmount + $shippingFee);

            $code = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(5));

            $order = $this->orderRepo->createOrder([
                'code'                   => $code,
                'payment_method_id'      => $data['payment_method_id'],
                'shipping_method_id'     => $data['shipping_method_id'],
                'shipping_fee'           => $shippingFee,
                'expected_delivery_date' => $expectedDeliveryDate,
                'created_by'             => $staffId,
                'status'                 => 'pending',
                'total_amount'           => $totalAmount,
                'discount_amount'        => $discountAmount,
                'final_amount'           => $finalAmount,
                'payment_status'         => 'unpaid',
                'note'                   => $data['note'] ?? null,
                'customer_name'          => $data['customer_name'],
                'customer_phone'         => $data['customer_phone'],
                'customer_address'       => $data['customer_address'],
                'tax_rate_id'            => $taxRateId,
                'tax_rate_snapshot'      => $taxRateSnapshot,
                'tax_amount'             => $taxAmount,
            ]);

            // Tạo OrderItems
            foreach ($preparedItems as $itemData) {
                $order->items()->create($itemData);
            }

            // Đặt chỗ tồn kho (Reserve) thay vì trừ ngay
            foreach ($items as $item) {
                $this->inventoryService->reserveStock(
                    $item['product_variant_id'],
                    $item['quantity']
                );
            }

            return $order->load(['paymentMethod', 'shippingMethod', 'staff', 'items']);
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

            // Tăng sold_count VÀ Trừ tồn kho thực tế khi đơn chuyển sang 'delivered'
            if ($oldStatus !== 'delivered' && $newStatus === 'delivered') {
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        Product::where('id', $item->product_id)
                            ->increment('sold_count', $item->quantity);
                    }

                    // Trừ tồn kho thực tế và trừ đặt chỗ
                    if ($item->product_variant_id) {
                        $this->inventoryService->decreaseStock(
                            $item->product_variant_id,
                            $item->quantity,
                            'order',
                            $order->id,
                            auth()->id(),
                            "Xuất kho sau khi giao hàng thành công: " . $order->code,
                            'order'
                        );
                        $this->inventoryService->releaseBooking($item->product_variant_id, $item->quantity);

                        if ($oldStatus === 'processing') {
                            $this->inventoryService->updatePackingStock($item->product_variant_id, $item->quantity, false);
                        }
                    }
                }
            }

            //  chuyển sang trạng thái processing
            if ($oldStatus !== 'processing' && $newStatus === 'processing') {
                foreach ($order->items as $item) {
                    if ($item->product_variant_id) {
                        // tăng số lượng Đang đóng gói
                        $this->inventoryService->updatePackingStock($item->product_variant_id, $item->quantity, true);

                        //  giảm số lượng Đang giao dịch
                        $this->inventoryService->releaseBooking($item->product_variant_id, $item->quantity);
                    }
                }
            }

            // Nếu đơn hàng rời khỏi trạng thái 'processing' (Trừ khi sang 'delivered' đã xử lý ở trên)
            if ($oldStatus === 'processing' && !in_array($newStatus, ['processing', 'delivered'])) {
                foreach ($order->items as $item) {
                    if ($item->product_variant_id) {
                        // 1. Giảm số lượng Đang đóng gói
                        $this->inventoryService->updatePackingStock($item->product_variant_id, $item->quantity, false);

                        // 2. Nếu quay lại 'pending' thì phải TĂNG lại Đang giao dịch (reserved)
                        if ($newStatus === 'pending') {
                            $this->inventoryService->reserveStock($item->product_variant_id, $item->quantity);
                        }
                    }
                }
            }

            // Xử lý khi status chuyển sang 'cancelled'
            if ($oldStatus !== 'cancelled' && $newStatus === 'cancelled') {
                // Nếu đơn đã delivered (đã trừ kho) thì phải hoàn lại tồn kho
                if ($oldStatus === 'delivered') {
                    foreach ($order->items as $item) {
                        if ($item->product_variant_id) {
                            $this->inventoryService->increaseStock(
                                $item->product_variant_id,
                                $item->quantity,
                                'order_cancel',
                                $order->id,
                                auth()->id(),
                                "Hoàn kho do huỷ đơn hàng đã giao: " . $order->code,
                                'order'
                            );
                        }
                    }
                } else {
                    // Nếu đơn chưa giao (chỉ mới reserve) thì chỉ cần giải phóng booking
                    foreach ($order->items as $item) {
                        if ($item->product_variant_id) {
                            $this->inventoryService->releaseBooking($item->product_variant_id, $item->quantity);

                            // Nếu đang đóng gói thì cũng phải giảm packing
                            if ($oldStatus === 'processing') {
                                $this->inventoryService->updatePackingStock($item->product_variant_id, $item->quantity, false);
                            }
                        }
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


    public function bulkUpdate(array $ids, string $action, ?string $status = null, $paymentMethodId = null)
    {
        return DB::transaction(function () use ($ids, $action, $status, $paymentMethodId) {
            $updatedCount = 0;

            $terminalStates = ['delivered', 'cancelled', 'returned', 'partially_returned'];

            foreach ($ids as $id) {
                $order = $this->orderRepo->findById($id);

                if ($action !== 'pay' && $action !== 'refund') {
                    if (in_array($order->status, $terminalStates)) {
                        continue;
                    }
                    if ($action === 'cancel' && $order->status === 'shipped') {
                        continue;
                    }
                }

                try {
                    if ($action === 'update_status') {
                        if ($order->status === 'shipped' && $status !== 'delivered') {
                            continue;
                        }
                        $this->updateOrder($id, ['status' => $status]);
                        $updatedCount++;
                    } elseif ($action === 'cancel') {
                        $this->cancelOrder($id);
                        $updatedCount++;
                    } elseif ($action === 'pay') {
                        if ($order->status === 'cancelled' || $order->status === 'returned') {
                            continue;
                        }
                        if ($order->payment_status === 'paid') {
                            continue;
                        }

                        $newPaymentStatus = 'paid';
                        if ($order->status === 'partially_returned') {
                            $newPaymentStatus = 'partially_paid';
                        }

                        $updateData = ['payment_status' => $newPaymentStatus];
                        if ($paymentMethodId) {
                            $updateData['payment_method_id'] = $paymentMethodId;
                        }

                        $order->update($updateData);
                        $updatedCount++;
                    } elseif ($action === 'refund') {
                        $orderStatus = strtolower($order->status);
                        $orderPaymentStatus = strtolower($order->payment_status);

                        // Allow refund for Cancelled or Fully Returned orders
                        if ($orderStatus !== 'cancelled' && $orderStatus !== 'returned') {
                            continue;
                        }

                        // Must have been paid at some point
                        if (in_array($orderPaymentStatus, ['paid', 'partially_paid', 'partially_refunded'])) {
                            $order->update(['payment_status' => 'refunded']);
                            $updatedCount++;
                        }
                    }
                } catch (\Exception $e) {
                    continue;
                }
            }
            return ['updated_count' => $updatedCount];
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

            // Xử lý hoàn tồn kho hoặc giải phóng booking
            if ($previousStatus === 'delivered') {
                foreach ($order->items as $item) {
                    if ($item->product_variant_id) {
                        $this->inventoryService->increaseStock(
                            $item->product_variant_id,
                            $item->quantity,
                            'order_cancel',
                            $order->id,
                            auth()->id(),
                            "Hoàn kho do huỷ đơn hàng đã giao: " . $order->code,
                            'order'
                        );
                    }
                }
            } else {
                foreach ($order->items as $item) {
                    if ($item->product_variant_id) {
                        $this->inventoryService->releaseBooking($item->product_variant_id, $item->quantity);

                        // Nếu đang đóng gói (processing) thì giảm packing
                        if ($previousStatus === 'processing') {
                            $this->inventoryService->updatePackingStock($item->product_variant_id, $item->quantity, false);
                        }
                    }
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

    public function updatePaymentMethod($id, $paymentMethodId)
    {
        return DB::transaction(function () use ($id, $paymentMethodId) {
            $order = $this->orderRepo->findById($id);

            if ($order->payment_status === 'paid') {
                throw new \Exception('Không thể thay đổi phương thức thanh toán cho đơn hàng đã thanh toán.');
            }

            $order->update([
                'payment_method_id' => $paymentMethodId,
            ]);

            return $order->load(['paymentMethod', 'shippingMethod', 'staff', 'items']);
        });
    }

    private function getItemImage($variant)
    {
        // 1. Ưu tiên ảnh của biến thể
        if ($variant->image) {
            return $variant->image;
        }

        // 2. Nếu không có, lấy ảnh đại diện (Feature Image) của sản phẩm
        if ($variant->product && $variant->product->feature_image) {
            return $variant->product->feature_image;
        }

        // 3. Nếu vẫn không có, lấy ảnh đầu tiên trong gallery sản phẩm
        if ($variant->product) {
            $firstImage = $variant->product->images()->first();
            if ($firstImage) {
                return $firstImage->image_path;
            }
        }

        return null;
    }
}
