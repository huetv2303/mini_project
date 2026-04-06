<?php

namespace App\Services;

use App\Models\Promotion;
use App\Models\PromotionUsage;
use App\Models\Order;
use Illuminate\Support\Carbon;
use Exception;

class PromotionService
{
    public function validate(string $code, array $cartItems, string $channel, ?int $userId = null): Promotion
    {
        $promotion = Promotion::where('code', $code)->first();

        if (!$promotion) {
            throw new Exception('Mã khuyến mại không tồn tại.');
        }

        if (!$promotion->is_active) {
            throw new Exception('Mã khuyến mại đã bị khóa hoặc không còn hoạt động.');
        }

        if ($promotion->applies_to !== 'all' && $promotion->applies_to !== $channel) {
            $channelName = $promotion->applies_to === 'pos' ? 'tại cửa hàng (POS)' : 'trên website';
            throw new Exception("Mã khuyến mại này chỉ được áp dụng {$channelName}.");
        }

        $now = Carbon::now();
        if ($promotion->starts_at && $now->lt($promotion->starts_at)) {
            throw new Exception('Mã khuyến mại chưa đến thời gian áp dụng.');
        }
        if ($promotion->expires_at && $now->gt($promotion->expires_at)) {
            throw new Exception('Mã khuyến mại đã hết hạn.');
        }

        if ($promotion->usage_limit !== null && $promotion->used_count >= $promotion->usage_limit) {
            throw new Exception('Mã khuyến mại đã hết lượt sử dụng.');
        }

        if ($userId && $promotion->usage_limit_per_user !== null) {
            $userUsageCount = PromotionUsage::where('promotion_id', $promotion->id)
                ->where('user_id', $userId)
                ->count();

            if ($userUsageCount >= $promotion->usage_limit_per_user) {
                throw new Exception("Bạn đã sử dụng mã này tối đa {$promotion->usage_limit_per_user} lần.");
            }
        }

        $eligibleSubtotal = $this->getEligibleSubtotal($promotion, $cartItems);

        if ($eligibleSubtotal < $promotion->min_order_amount) {
            throw new Exception('Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã này (Tối thiểu: ' . number_format($promotion->min_order_amount) . 'đ).');
        }

        if ($eligibleSubtotal == 0) {
            throw new Exception('Mã khuyến mại này không áp dụng cho các sản phẩm trong giỏ hàng.');
        }

        return $promotion;
    }


    public function getEligibleSubtotal(Promotion $promotion, array $cartItems): float
    {
        if ($promotion->scope === 'all') {
            return collect($cartItems)->sum('subtotal');
        }

        $eligibleSubtotal = 0;

        if ($promotion->scope === 'category') {
            $allowedCategoryIds = $promotion->categories()->pluck('categories.id')->toArray();
            foreach ($cartItems as $item) {
                if (in_array($item['category_id'], $allowedCategoryIds)) {
                    $eligibleSubtotal += $item['subtotal'];
                }
            }
        } elseif ($promotion->scope === 'product') {
            $allowedProductIds = $promotion->products()->pluck('products.id')->toArray();
            foreach ($cartItems as $item) {
                if (in_array($item['product_id'], $allowedProductIds)) {
                    $eligibleSubtotal += $item['subtotal'];
                }
            }
        }

        return $eligibleSubtotal;
    }


    public function calculateDiscount(Promotion $promotion, float $eligibleSubtotal): float
    {
        $discountAmount = 0;

        if ($promotion->type === 'fixed') {
            $discountAmount = $promotion->value;
            if ($discountAmount > $eligibleSubtotal) {
                $discountAmount = $eligibleSubtotal;
            }
        } elseif ($promotion->type === 'percent') {
            $discountAmount = $eligibleSubtotal * ($promotion->value / 100);
            if ($promotion->max_discount_amount && $discountAmount > $promotion->max_discount_amount) {
                $discountAmount = $promotion->max_discount_amount;
            }
        }

        return round($discountAmount, 2);
    }


    public function redeem(Promotion $promotion, Order $order, ?int $userId = null): PromotionUsage
    {
        $promotion->increment('used_count');

        return PromotionUsage::create([
            'promotion_id' => $promotion->id,
            'order_id' => $order->id,
            'user_id' => $userId,
            'used_at' => Carbon::now(),
        ]);
    }
}
