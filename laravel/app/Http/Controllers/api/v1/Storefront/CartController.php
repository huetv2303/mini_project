<?php

namespace App\Http\Controllers\api\v1\Storefront;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class CartController extends Controller
{
    /**
     * Get Redis key for the user/session
     */
    private function getCartKey($userId)
    {
        return "cart:user_{$userId}";
    }

    /**
     * Get current cart content
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $cartKey = $this->getCartKey($userId);
        
        $cart = Redis::get($cartKey);
        $cartItems = $cart ? json_decode($cart, true) : [];

        // Hydrate cart items with current product/variant data (Price, Image, etc.)
        $detailedItems = [];
        foreach ($cartItems as $variantId => $item) {
            $variant = ProductVariant::with(['product', 'attributes'])->find($variantId);
            if ($variant) {
                $detailedItems[] = [
                    'variant_id' => (int)$variantId,
                    'product_id' => $variant->product_id,
                    'category_id' => $variant->product->category_id,
                    'name' => $variant->product->name,
                    'price' => (float)$variant->price,
                    'quantity' => (int)$item['quantity'],
                    'image' => $variant->image ?? $variant->product->image,
                    'sku' => $variant->sku,
                    'attributes' => $variant->attributes,
                    'slug' => $variant->product->slug // Added for frontend links
                ];
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => $detailedItems
        ]);
    }

    /**
     * Add to Cart or Update quantity
     */
    public function store(Request $request)
    {
        $request->validate([
            'variant_id' => 'required|exists:product_variants,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $userId = $request->user()->id;
        $cartKey = $this->getCartKey($userId);
        $variantId = $request->variant_id;
        $quantity = $request->quantity;

        // Get existing cart
        $cart = Redis::get($cartKey);
        $cartItems = $cart ? json_decode($cart, true) : [];

        // Update or Add
        if (isset($cartItems[$variantId])) {
            $cartItems[$variantId]['quantity'] += $quantity;
        } else {
            $cartItems[$variantId] = [
                'quantity' => $quantity,
                'added_at' => now()->toDateTimeString()
            ];
        }

        // Save back to Redis (Expires in 30 days)
        Redis::setex($cartKey, 2592000, json_encode($cartItems));

        return response()->json([
            'status' => 'success',
            'message' => 'Sản phẩm đã được thêm vào giỏ hàng',
            'cart_count' => count($cartItems)
        ]);
    }

    /**
     * Update item quantity directly
     */
    public function update(Request $request, $variantId)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $userId = $request->user()->id;
        $cartKey = $this->getCartKey($userId);

        $cart = Redis::get($cartKey);
        $cartItems = $cart ? json_decode($cart, true) : [];

        if (isset($cartItems[$variantId])) {
            $cartItems[$variantId]['quantity'] = $request->quantity;
            Redis::setex($cartKey, 2592000, json_encode($cartItems));
            
            return response()->json([
                'status' => 'success',
                'message' => 'Số lượng đã được cập nhật'
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Sản phẩm không có trong giỏ hàng'
        ], 404);
    }

    /**
     * Remove item from cart
     */
    public function destroy(Request $request, $variantId)
    {
        $userId = $request->user()->id;
        $cartKey = $this->getCartKey($userId);

        $cart = Redis::get($cartKey);
        $cartItems = $cart ? json_decode($cart, true) : [];

        if (isset($cartItems[$variantId])) {
            unset($cartItems[$variantId]);
            Redis::setex($cartKey, 2592000, json_encode($cartItems));
            
            return response()->json([
                'status' => 'success',
                'message' => 'Sản phẩm đã được xóa khỏi giỏ hàng'
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Sản phẩm không tìm thấy'
        ], 404);
    }

    /**
     * Clear all items
     */
    public function clear(Request $request)
    {
        $userId = $request->user()->id;
        $cartKey = $this->getCartKey($userId);
        
        Redis::del($cartKey);

        return response()->json([
            'status' => 'success',
            'message' => 'Giỏ hàng đã được làm trống'
        ]);
    }

    /**
     * Sync Guest Cart to Redis
     */
    public function sync(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $userId = $request->user()->id;
        $cartKey = $this->getCartKey($userId);

        $cart = Redis::get($cartKey);
        $cartItems = $cart ? json_decode($cart, true) : [];

        foreach ($request->items as $item) {
            $vId = $item['variant_id'];
            if (isset($cartItems[$vId])) {
                $cartItems[$vId]['quantity'] += $item['quantity'];
            } else {
                $cartItems[$vId] = [
                    'quantity' => $item['quantity'],
                    'added_at' => now()->toDateTimeString()
                ];
            }
        }

        Redis::setex($cartKey, 2592000, json_encode($cartItems));

        return response()->json([
            'status' => 'success',
            'message' => 'Giỏ hàng đã được đồng bộ'
        ]);
    }
}
