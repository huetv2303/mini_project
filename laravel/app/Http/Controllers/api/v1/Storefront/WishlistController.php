<?php

namespace App\Http\Controllers\api\v1\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class WishlistController extends Controller
{
    private function getWishlistKey($userId)
    {
        return "wishlist:user_{$userId}";
    }

    /**
     * Get Wishlist items
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $wishlistKey = $this->getWishlistKey($userId);

        $wishlist = Redis::get($wishlistKey);
        $productIds = $wishlist ? json_decode($wishlist, true) : [];

        $products = Product::whereIn('id', $productIds)->get();

        return response()->json([
            'status' => 'success',
            'data' => $products
        ]);
    }

    /**
     * Toggle Wishlist (Add or Remove)
     */
    public function toggle(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $userId = $request->user()->id;
        $wishlistKey = $this->getWishlistKey($userId);
        $productId = (int)$request->product_id;

        $wishlistData = Redis::get($wishlistKey);
        $wishlist = $wishlistData ? json_decode($wishlistData, true) : [];

        $index = array_search($productId, $wishlist);

        if ($index !== false) {
            array_splice($wishlist, $index, 1);
            $action = 'removed';
            $message = 'Đã xóa khỏi danh sách yêu thích';
        } else {
            $wishlist[] = $productId;
            $action = 'added';
            $message = 'Đã thêm vào danh sách yêu thích';
        }

        Redis::setex($wishlistKey, 7776000, json_encode($wishlist));

        return response()->json([
            'status' => 'success',
            'action' => $action,
            'message' => $message,
            'wishlist_count' => count($wishlist)
        ]);
    }

    /**
     * Clear all
     */
    public function clear(Request $request)
    {
        $userId = $request->user()->id;
        $wishlistKey = $this->getWishlistKey($userId);
        Redis::del($wishlistKey);

        return response()->json([
            'status' => 'success',
            'message' => 'Đã xóa toàn bộ yêu thích'
        ]);
    }
}
