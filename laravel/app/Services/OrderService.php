<?php

namespace App\Services;

use App\Interfaces\Order\OrderRepositoryInterface;
use App\Models\CustomerProfile;
use App\Models\Inventory;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Promotion;
use App\Models\ShippingMethod;
use App\Models\TaxRate;
use Illuminate\Support\Facades\DB;
use \Illuminate\Support\Str;
use App\Models\User;

class OrderService
{
    protected $orderRepo;
    protected $inventoryService;
    protected $promotionService;

    public function __construct(
        OrderRepositoryInterface $orderRepo,
        InventoryService $inventoryService,
        PromotionService $promotionService
    ) {
        $this->orderRepo = $orderRepo;
        $this->inventoryService = $inventoryService;
        $this->promotionService = $promotionService;
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
            $shippingMethodId = $data['shipping_method_id'] ?? null;
            if ($shippingMethodId) {
                $shippingMethod = ShippingMethod::findOrFail($shippingMethodId);
                $shippingFee = $shippingMethod->cost;
                $expectedDeliveryDate = now()->addDays($shippingMethod->estimated_days)->format('Y-m-d');
            } else {
                $shippingFee = floatval($data['shipping_fee'] ?? 0);
                $expectedDeliveryDate = null;
            }

            $discountAmount = $data['discount_amount'] ?? 0;

            // Tính thuế
            $taxRateId = $data['tax_rate_id'] ?? null;
            $taxRateSnapshot = 0;
            $taxAmount = 0;
            if ($taxRateId) {
                $taxRate = TaxRate::find($taxRateId);
                if ($taxRate) {
                    $taxRateSnapshot = $taxRate->rate;
                    $taxAmount = ($totalAmount - $discountAmount) * ($taxRateSnapshot / 100);
                }
            }

            $finalAmount = max(0, ($totalAmount - $discountAmount) + $taxAmount + $shippingFee);

            $code = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(5));

            // Xử lý thông tin khách hàng (Snapshot)
            $customerId = $data['customer_id'] ?? null;
            $customerName = $data['customer_name'] ?? null;
            $customerPhone = $data['customer_phone'] ?? null;
            $customerAddress = $data['customer_address'] ?? null;

            if ($customerId) {
                $customerUser = User::with('customerProfile')->find($customerId);
                if ($customerUser) {
                    $customerName = $customerName ?? $customerUser->name;
                    $customerPhone = $customerPhone ?? $customerUser->customerProfile?->phone;
                    $customerAddress = $customerAddress ?? $customerUser->customerProfile?->address;
                }
            }

            $isPickup = ($data['fulfillment_type'] ?? null) === 'pickup';
            $initialStatus = $isPickup ? 'delivered' : 'pending';
            $initialPaymentStatus = $isPickup ? 'paid' : 'unpaid';

            $order = $this->orderRepo->createOrder([
                'code'                   => $code,
                'payment_method_id'      => $data['payment_method_id'],
                'shipping_method_id'     => $shippingMethodId,
                'fulfillment_type'       => $data['fulfillment_type'] ?? null,
                'shipping_fee'           => $shippingFee,
                'shipping_address'       => $data['shipping_address'] ?? null,
                'expected_delivery_date' => $expectedDeliveryDate,
                'created_by'             => $staffId,
                'status'                 => $initialStatus,
                'total_amount'           => $totalAmount,
                'discount_amount'        => $discountAmount,
                'final_amount'           => $finalAmount,
                'payment_status'         => $initialPaymentStatus,
                'note'                   => $data['note'] ?? null,
                'customer_id'            => $customerId,
                'customer_name'          => $data['recipient_name'] ?? $customerName ?? 'Khách lẻ',
                'customer_phone'         => $data['recipient_phone'] ?? $customerPhone ?? null,
                'customer_address'       => $data['shipping_address'] ?? $customerAddress ?? null,
                'tax_rate_id'            => $taxRateId,
                'tax_rate_snapshot'      => $taxRateSnapshot,
                'tax_amount'             => $taxAmount,
                'promotion_id'           => $data['promotion_id'] ?? null,
                'promotion_code_snapshot' => $data['promotion_code_snapshot'] ?? null,
            ]);

            // Tạo OrderItems
            foreach ($preparedItems as $itemData) {
                $order->items()->create($itemData);
            }

            foreach ($items as $item) {
                if ($isPickup) {
                    $this->inventoryService->decreaseStock(
                        $item['product_variant_id'],
                        $item['quantity'],
                        'order',
                        $order->id,
                        $staffId,
                        "Bán hàng tại quầy: " . $order->code,
                        'order'
                    );

                    $variant = ProductVariant::find($item['product_variant_id']);
                    if ($variant && $variant->product_id) {
                        Product::where('id', $variant->product_id)
                            ->increment('sold_count', $item['quantity']);
                    }
                } else {
                    $this->inventoryService->reserveStock(
                        $item['product_variant_id'],
                        $item['quantity']
                    );
                }
            }

            if (!empty($data['promotion_id'])) {
                $promotion = Promotion::find($data['promotion_id']);
                if ($promotion) {
                    $this->promotionService->redeem($promotion, $order, $customerId);
                }
            }

            if ($customerId) {
                CustomerProfile::where('user_id', $customerId)->increment('total_orders');
                CustomerProfile::where('user_id', $customerId)->increment('total_spent', $finalAmount);
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

            if ($oldStatus !== 'delivered' && $newStatus === 'delivered') {
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        Product::where('id', $item->product_id)
                            ->increment('sold_count', $item->quantity);
                    }

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

            if ($oldStatus !== 'processing' && $newStatus === 'processing') {
                foreach ($order->items as $item) {
                    if ($item->product_variant_id) {
                        $this->inventoryService->updatePackingStock($item->product_variant_id, $item->quantity, true);

                        $this->inventoryService->releaseBooking($item->product_variant_id, $item->quantity);
                    }
                }
            }

            if ($oldStatus === 'processing' && !in_array($newStatus, ['processing', 'delivered'])) {
                foreach ($order->items as $item) {
                    if ($item->product_variant_id) {
                        $this->inventoryService->updatePackingStock($item->product_variant_id, $item->quantity, false);

                        if ($newStatus === 'pending') {
                            $this->inventoryService->reserveStock($item->product_variant_id, $item->quantity);
                        }
                    }
                }
            }

            if ($oldStatus !== 'cancelled' && $newStatus === 'cancelled') {
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
                    foreach ($order->items as $item) {
                        if ($item->product_variant_id) {
                            $this->inventoryService->releaseBooking($item->product_variant_id, $item->quantity);
                            if ($oldStatus === 'processing') {
                                $this->inventoryService->updatePackingStock($item->product_variant_id, $item->quantity, false);
                            }
                        }
                    }
                }
                if ($oldStatus === 'delivered') {
                    foreach ($order->items as $item) {
                        if ($item->product_id) {
                            Product::where('id', $item->product_id)
                                ->decrement('sold_count', $item->quantity);
                        }
                    }
                }

                if ($order->customer_id) {
                    CustomerProfile::where('user_id', $order->customer_id)
                        ->decrement('total_orders');
                    CustomerProfile::where('user_id', $order->customer_id)
                        ->decrement('total_spent', max(0, $order->final_amount));
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
                try {
                    $order = $this->orderRepo->findById($id);

                    if ($action !== 'pay' && $action !== 'refund') {
                        if (in_array($order->status, $terminalStates)) {
                            continue;
                        }
                        if ($action === 'cancel' && $order->status === 'shipped') {
                            continue;
                        }
                    }

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
                        $this->refundOrder($id);
                        $updatedCount++;
                    }
                } catch (\Exception $e) {
                    continue;
                }
            }
            return ['updated_count' => $updatedCount];
        });
    }

    public function refundOrder($id)
    {
        return DB::transaction(function () use ($id) {
            $order = $this->orderRepo->findById($id);
            $orderStatus = strtolower($order->status);
            $orderPaymentStatus = strtolower($order->payment_status);

            if ($orderStatus !== 'cancelled' && $orderStatus !== 'returned') {
                throw new \Exception('Chỉ có thể hoàn tiền cho đơn hàng đã hủy hoặc đã trả hàng.');
            }

            if (!in_array($orderPaymentStatus, ['paid', 'partially_paid', 'partially_refunded'])) {
                throw new \Exception('Đơn hàng chưa được thanh toán hoặc đã được hoàn tiền.');
            }

            $order->update(['payment_status' => 'refunded']);
            return $order;
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

                        if ($previousStatus === 'processing') {
                            $this->inventoryService->updatePackingStock($item->product_variant_id, $item->quantity, false);
                        }
                    }
                }
            }

            if ($previousStatus === 'delivered') {
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        Product::where('id', $item->product_id)
                            ->decrement('sold_count', $item->quantity);
                    }
                }
            }

            $order->update(['status' => 'cancelled']);

            if ($order->customer_id) {
                CustomerProfile::where('user_id', $order->customer_id)
                    ->decrement('total_orders');
                CustomerProfile::where('user_id', $order->customer_id)
                    ->decrement('total_spent', max(0, $order->final_amount));
            }

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
