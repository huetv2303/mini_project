<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Promotion\StorePromotionRequest;
use App\Http\Requests\Promotion\UpdatePromotionRequest;
use App\Models\Promotion;
use App\Services\PromotionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Exception;

class PromotionController extends Controller
{
    protected $promotionService;

    public function __construct(PromotionService $promotionService)
    {
        $this->promotionService = $promotionService;
    }

    public function index(Request $request)
    {
        $query = Promotion::query();

        $query->when($request->search, function ($q, $search) {
            $q->where('code', 'LIKE', "%{$search}%")
                ->orWhere('name', 'LIKE', "%{$search}%");
        });

        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active === 'true' || $request->is_active === '1');
        }

        $perPage = $request->input('per_page', 10);
        $promotions = $query->with(['categories', 'products'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $promotions
        ]);
    }

    public function store(StorePromotionRequest $request)
    {
        $request->validated();
        try {
            DB::beginTransaction();

            $promotion = Promotion::create($request->except(['category_ids', 'product_ids']));

            if ($request->scope == 'category' && $request->has('category_ids')) {
                $promotion->categories()->sync($request->category_ids);
            } elseif ($request->scope == 'product' && $request->has('product_ids')) {
                $promotion->products()->sync($request->product_ids);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Tạo mã khuyến mại thành công',
                'data' => $promotion->load(['categories', 'products'])
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'Lỗi tạo khuyến mại: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $promotion = Promotion::with(['categories', 'products'])->find($id);

        if (!$promotion) {
            return response()->json(['status' => 'error', 'message' => 'Không tìm thấy khuyến mại'], 404);
        }

        return response()->json(['status' => 'success', 'data' => $promotion]);
    }

    public function update(UpdatePromotionRequest $request, $id)
    {
        $promotion = Promotion::find($id);

        if (!$promotion) {
            return response()->json(['status' => 'error', 'message' => 'Không tìm thấy khuyến mại'], 404);
        }

        $request->validated();

        try {
            DB::beginTransaction();

            $promotion->update($request->except(['category_ids', 'product_ids']));

            if ($request->scope == 'category') {
                $promotion->categories()->sync($request->category_ids ?? []);
                $promotion->products()->detach();
            } elseif ($request->scope == 'product') {
                $promotion->products()->sync($request->product_ids ?? []);
                $promotion->categories()->detach();
            } else {
                $promotion->categories()->detach();
                $promotion->products()->detach();
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Cập nhật mã khuyến mại thành công',
                'data' => $promotion->load(['categories', 'products'])
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'Lỗi cập nhật khuyến mại: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $promotion = Promotion::find($id);

        if (!$promotion) {
            return response()->json(['status' => 'error', 'message' => 'Không tìm thấy khuyến mại'], 404);
        }

        try {
            $promotion->delete();
            return response()->json(['status' => 'success', 'message' => 'Xóa mã khuyến mại thành công']);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Lỗi xóa khuyến mại: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Apply a promotion code (For POS Admin)
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
                'pos',
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

    /**
     * Get all eligible promotions for a given cart
     */
    public function getEligiblePromotions(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'cart_items' => 'required|array',
            'cart_items.*.product_id' => 'required',
            'cart_items.*.category_id' => 'required',
            'cart_items.*.subtotal' => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => $validator->errors()->first()], 422);
        }

        $cartItems = $request->cart_items;
        $customerId = $request->input('customer_id');
        $channel = $request->input('channel', 'pos');

        $activePromotions = Promotion::where('is_active', true)
            ->where(function ($q) use ($channel) {
                $q->where('applies_to', 'all')->orWhere('applies_to', $channel);
            })
            ->where(function ($q) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>=', now());
            })
            ->get();

        $eligiblePromotions = [];

        foreach ($activePromotions as $promotion) {
            try {
                $eligibleSubtotal = $this->promotionService->getEligibleSubtotal($promotion, $cartItems);

                if ($eligibleSubtotal <= 0) continue;

                $isEligible = true;
                $reason = null;

                try {
                    $this->promotionService->validate($promotion->code, $cartItems, $channel, $customerId);
                } catch (Exception $e) {
                    $isEligible = false;
                    $reason = $e->getMessage();
                }

                $discountAmount = $isEligible ? $this->promotionService->calculateDiscount($promotion, $eligibleSubtotal) : 0;

                $eligiblePromotions[] = [
                    'promotion' => $promotion->load(['categories', 'products']),
                    'eligible_subtotal' => $eligibleSubtotal,
                    'discount_amount' => $discountAmount,
                    'is_eligible' => $isEligible,
                    'reason' => $reason
                ];
            } catch (Exception $e) {
                continue;
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => $eligiblePromotions
        ]);
    }
}
