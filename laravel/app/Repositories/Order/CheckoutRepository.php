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
        foreach ($rawItems as $item) {
            $variant = ProductVariant::findOrFail($item['product_variant_id']);
            $subtotal += $variant->price * $item['quantity'];
        }

        $shippingFee = 0;
        $shippingMethod = ShippingMethod::find($request->shipping_method_id);
        if ($shippingMethod) {
            $shippingFee = $shippingMethod->cost;
        }

        $discountAmount = floatval($request->input('discount_amount', 0));
        $finalAmount = max(0, ($subtotal - $discountAmount) + $shippingFee);

        return [
            'subtotal' => $subtotal,
            'shipping_fee' => $shippingFee,
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


            $finalAmount = max(0, ($subtotal - $discountAmount) + $shippingFee);


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
                'final_amount'            => $finalAmount,
                'expected_delivery_date'  => $expectedDeliveryDate,
                'status'                  => 'pending',
                'payment_status'          => 'unpaid',
                'note'                    => $request->input('note'),
                'promotion_id'            => $promotionId,
                'promotion_code_snapshot' => $promotionCodeSnapshot,
                'source'                  => 'web',
            ]);


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

            return $order->load(['items', 'shippingMethod', 'paymentMethod']);
        });
    }
}
