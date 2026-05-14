<?php

namespace App\Services\Chatbot\Functions\Customer;

use App\Services\Chatbot\Functions\ChatFunctionInterface;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GetActivePromotionsFunction implements ChatFunctionInterface
{
    public function getName(): string
    {
        return 'getActivePromotions';
    }

    public function getDescription(): string
    {
        return 'Lấy danh sách các chương trình khuyến mãi, mã giảm giá (Voucher) đang còn hiệu lực để giới thiệu cho khách hàng.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => (object)[] // Đảm bảo ra {} trong JSON
        ];
    }

    public function execute(array $args): array
    {
        $now = Carbon::now();

        $promotions = DB::table('promotions')
            ->where('is_active', true)
            ->where(function ($query) use ($now) {
                $query->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', $now);
            })
            ->where(function ($query) use ($now) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>=', $now);
            })
            ->where(function ($query) {
                $query->whereNull('usage_limit')
                    ->orWhereRaw('used_count < usage_limit');
            })
            ->select('code', 'name', 'description', 'type', 'value', 'min_order_amount', 'expires_at')
            ->limit(5)
            ->get();

        if ($promotions->isEmpty()) {
            return [
                'has_promotions' => false,
                'message' => "Hiện tại chưa có chương trình khuyến mãi mới. Bạn hãy quay lại sau nhé!"
            ];
        }

        return [
            'has_promotions' => true,
            'promotions' => $promotions->map(function ($p) {
                // Hỗ trợ cả 'percent' và 'percentage'
                $isPercent = in_array($p->type, ['percent', 'percentage']);
                $discount = $isPercent ? (int)$p->value . '%' : number_format($p->value, 0, ',', '.') . 'đ';

                return [
                    'code' => $p->code,
                    'title' => $p->name,
                    'desc' => $p->description,
                    'discount' => $discount,
                    'min_order' => number_format($p->min_order_amount, 0, ',', '.') . 'đ',
                    'expiry' => $p->expires_at ? Carbon::parse($p->expires_at)->format('d/m/Y') : 'Không hết hạn'
                ];
            })->toArray()
        ];
    }
}
