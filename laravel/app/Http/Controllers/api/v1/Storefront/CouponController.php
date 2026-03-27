<?php

namespace App\Http\Controllers\api\v1\Storefront;

use App\Http\Controllers\Controller;
use App\Services\PromotionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Exception;

class CouponController extends Controller
{
    protected $promotionService;

    public function __construct(PromotionService $promotionService)
    {
        $this->promotionService = $promotionService;
    }

    /**
     * Apply a promotion code (For Customer Website)
     */
    public function apply(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string',
            'cart_items' => 'required|array',
            'cart_items.*.product_id' => 'required|integer',
            'cart_items.*.category_id' => 'required|integer',
            'cart_items.*.subtotal' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => $validator->errors()->first()], 422);
        }

        try {

            $customerId = $request->input('customer_id');

            $promotion = $this->promotionService->validate(
                $request->code,
                $request->cart_items,
                'website',
                $customerId
            );

            $eligibleSubtotal = $this->promotionService->getEligibleSubtotal($promotion, $request->cart_items);
            $discountAmount = $this->promotionService->calculateDiscount($promotion, $eligibleSubtotal);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'promotion' => $promotion->load(['categories', 'products']),
                    'eligible_subtotal' => $eligibleSubtotal,
                    'discount_amount' => $discountAmount
                ]
            ]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 400);
        }
    }
}
