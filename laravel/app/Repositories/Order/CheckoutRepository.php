<?php

namespace App\Repositories\Order;

use App\Interfaces\Order\CheckoutRepositoryInterface;
use App\Models\CustomerProfile;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\Promotion;
use App\Models\ShippingMethod;
use App\Services\InventoryService;
use App\Services\PromotionService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use \Illuminate\Http\Request;
use App\Models\User;
use App\Events\OrderPlaced;
use App\Notifications\OrderPlacedNotification;
use Illuminate\Support\Facades\Notification;


class CheckoutRepository implements CheckoutRepositoryInterface
{

    public function calculateSummary($request)
    {
        $mode = $request->input('mode', 'cart');
        if ($mode === 'buynow') {
            $rawItems = [[
                'product_variant_id' => $request->product_variant_id,
                'quantity'           => $request->quantity,
            ]];
        } else {
            $rawItems = $request->input('items', []);
        }

        $subtotal = 0;
        $taxableSubtotal = 0;
        foreach ($rawItems as $item) {
            $variant = ProductVariant::with('product')->findOrFail($item['product_variant_id']);
            $itemSubtotal = $variant->price * $item['quantity'];
            $subtotal += $itemSubtotal;
            if ($variant->product && $variant->product->is_taxable) {
                $taxableSubtotal += $itemSubtotal;
            }
        }

        $shippingFee = 0;
        $shippingMethod = ShippingMethod::find($request->shipping_method_id);
        if ($shippingMethod) {
            $shippingFee = $shippingMethod->cost;
        }

        $discountAmount = floatval($request->input('discount_amount', 0));
        
        $taxRate = \App\Models\TaxRate::where('is_active', true)->first();
        $taxAmount = 0;
        $taxRateSnapshot = 0;
        if ($taxRate) {
            $taxRateSnapshot = $taxRate->rate;
            $taxableRatio = $subtotal > 0 ? $taxableSubtotal / $subtotal : 0;
            $discountForTaxable = $discountAmount * $taxableRatio;
            $taxAmount = max(0, $taxableSubtotal - $discountForTaxable) * ($taxRateSnapshot / 100);
        }

        $finalAmount = max(0, ($subtotal - $discountAmount) + $shippingFee + $taxAmount);

        return [
            'subtotal' => $subtotal,
            'shipping_fee' => $shippingFee,
            'tax_amount' => $taxAmount,
            'tax_rate_snapshot' => $taxRateSnapshot,
            'final_amount' => $finalAmount,
            'discount_amount' => $discountAmount,
            'items_count' => count($rawItems)
        ];
    }

    public function checkout($input = null)
    {
        $data = $input instanceof Request ? $input->all() : $input;
        $request = new Request($data);

        return DB::transaction(function () use ($request) {
            $user = auth('api')->user();
            $mode = $request->input('mode', 'cart');


            if ($mode === 'buynow') {
                $rawItems = [[
                    'product_variant_id' => $request->product_variant_id,
                    'quantity'           => $request->quantity,
                ]];
            } else {
                $rawItems = $request->input('items', []);
            }


            $subtotal      = 0;
            $taxableAmount = 0;
            $preparedItems = [];

            foreach ($rawItems as $item) {
                $variant = ProductVariant::with('product')
                    ->findOrFail($item['product_variant_id']);

                $inventory = Inventory::where('variant_id', $variant->id)->first();
                $available = $inventory ? $inventory->quantity : 0;

                if ($available < $item['quantity']) {
                    throw new \Exception(
                        "Sản phẩm \"{$variant->product->name} - {$variant->name}\" không đủ tồn kho. " .
                            "Hiện có: {$available}, yêu cầu: {$item['quantity']}."
                    );
                }

                $itemPrice    = $variant->price;
                $itemSubtotal = $itemPrice * $item['quantity'];
                $subtotal    += $itemSubtotal;

                if ($variant->product && $variant->product->is_taxable) {
                    $taxableAmount += $itemSubtotal;
                }

                $preparedItems[] = [
                    'product_id'         => $variant->product_id,
                    'product_variant_id' => $variant->id,
                    'product_name'       => $variant->product->name,
                    'variant_name'       => $variant->name,
                    'sku'                => $variant->sku,
                    'price'              => $itemPrice,
                    'quantity'           => $item['quantity'],
                    'subtotal'           => $itemSubtotal,
                    'image'              => $variant->image ?? $variant->product->feature_image,
                ];
            }

            $shippingFee          = 0;
            $expectedDeliveryDate = null;
            $shippingMethod = ShippingMethod::find($request->shipping_method_id);
            if ($shippingMethod) {
                $shippingFee          = $shippingMethod->cost;
                $expectedDeliveryDate = now()->addDays($shippingMethod->estimated_days ?? 3)->format('Y-m-d');
            }


            $discountAmount         = floatval($request->input('discount_amount', 0));
            $promotionId            = $request->input('promotion_id');
            $promotionCodeSnapshot  = $request->input('promotion_code_snapshot');

            $taxRate = \App\Models\TaxRate::where('is_active', true)->first();
            $taxAmount = 0;
            $taxRateSnapshot = 0;
            $taxRateId = null;
            if ($taxRate) {
                $taxRateId = $taxRate->id;
                $taxRateSnapshot = $taxRate->rate;
                $taxableRatio = $subtotal > 0 ? $taxableAmount / $subtotal : 0;
                $discountForTaxable = $discountAmount * $taxableRatio;
                $taxAmount = max(0, $taxableAmount - $discountForTaxable) * ($taxRateSnapshot / 100);
            }

            $finalAmount = max(0, ($subtotal - $discountAmount) + $shippingFee + $taxAmount);


            $customerId = $user?->id;
            $customerName = $request->input('customer_name')
                ?? $user?->name
                ?? 'Guest';
            $customerPhone = $request->input('customer_phone')
                ?? $user?->customerProfile?->phone;

            $orderCode = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            $order = Order::create([
                'code'                    => $orderCode,
                'customer_id'             => $customerId,
                'customer_name'           => $customerName,
                'customer_phone'          => $customerPhone,
                'customer_address'        => $request->input('address'),
                'shipping_method_id'      => $request->input('shipping_method_id'),
                'payment_method_id'       => $request->input('payment_method_id'),
                'total_amount'            => $subtotal,
                'discount_amount'         => $discountAmount,
                'shipping_fee'            => $shippingFee,
                'tax_rate_id'             => $taxRateId,
                'tax_rate_snapshot'       => $taxRateSnapshot,
                'tax_amount'              => $taxAmount,
                'final_amount'            => $finalAmount,
                'expected_delivery_date'  => $expectedDeliveryDate,
                'status'                  => 'pending',
                'payment_status'          => 'unpaid',
                'note'                    => $request->input('note'),
                'promotion_id'            => $promotionId,
                'promotion_code_snapshot' => $promotionCodeSnapshot,
                'source'                  => 'web',
            ]);

            // Xử lý thanh toán qua ví
            $useWallet = $request->boolean('use_wallet');
            $walletAmountUsed = 0;
            if ($useWallet && $user && $user->wallet_balance > 0) {
                $walletAmountUsed = min($user->wallet_balance, $finalAmount);
                app(\App\Services\WalletService::class)->withdraw(
                    $user,
                    $walletAmountUsed,
                    'order',
                    $order->id,
                    "Thanh toán đơn hàng: " . $order->code
                );

                $order->update([
                    'wallet_amount_used' => $walletAmountUsed,
                    'payment_status' => ($walletAmountUsed >= $finalAmount) ? 'paid' : 'partially_paid'
                ]);
            }


            $inventoryService = app(InventoryService::class);

            foreach ($preparedItems as $itemData) {
                $order->items()->create($itemData);

                $inventoryService->reserveStock(
                    $itemData['product_variant_id'],
                    $itemData['quantity']
                );
            }


            if ($promotionId) {
                $promotion = Promotion::find($promotionId);
                if ($promotion) {
                    app(PromotionService::class)->redeem($promotion, $order, $customerId);
                }
            }


            if ($customerId) {
                CustomerProfile::where('user_id', $customerId)
                    ->increment('total_orders');
                CustomerProfile::where('user_id', $customerId)
                    ->increment('total_spent', $finalAmount);
            }

            // --- Realtime Notifications ---
            // 1. Dispatch event for instant Toast on Admin Dashboard
            OrderPlaced::dispatch($order);

            // 2. Send notification to Customer
            if ($order->customer) {
                $order->customer->notify(new \App\Notifications\OrderStatusNotification($order));
            }

            // 3. Send notification to all Admins for database storage & bell icon
            $admins = User::whereHas('role', function($q) { $q->where('code', 'admin'); })->get();
            Notification::send($admins, new \App\Notifications\OrderPlacedNotification($order));
            // ------------------------------

            return $order->load(['items', 'shippingMethod', 'paymentMethod']);
        });
    }
}
