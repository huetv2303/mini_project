<?php

namespace App\Services\Chatbot\Functions\Admin;

use App\Services\Chatbot\Functions\ChatFunctionInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class GetPromotionStatsFunction implements ChatFunctionInterface
{
    public function getName(): string
    {
        return 'getPromotionStats';
    }

    public function getDescription(): string
    {
        return 'Báo cáo hiệu quả sử dụng các chương trình khuyến mãi/Voucher. Cho biết mã nào được dùng nhiều nhất.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'is_active' => [
                    'type' => 'boolean',
                    'description' => 'Chỉ xem các chương trình đang còn hiệu lực (true) hoặc tất cả (false).',
                    'default' => true
                ]
            ]
        ];
    }

    public function execute(array $args): array
    {
        $isActiveOnly = $args['is_active'] ?? true;

        $query = DB::table('promotions')
            ->select('code', 'name', 'type', 'value', 'used_count', 'usage_limit', 'expires_at');

        if ($isActiveOnly) {
            $query->where('is_active', true)
                ->where('expires_at', '>', now());
        }

        $promotions = $query->orderBy('used_count', 'desc')
            ->limit(10)
            ->get();

        return [
            'active_only' => $isActiveOnly,
            'promotions' => $promotions->map(function ($p) {
                return [
                    'code' => $p->code,
                    'name' => $p->name,
                    'value_display' => $p->type === 'percentage' ? $p->value . '%' : number_format($p->value, 0, ',', '.') . 'đ',
                    'used' => $p->used_count . ($p->usage_limit ? ' / ' . $p->usage_limit : ''),
                    'expires' => $p->expires_at ? Carbon::parse($p->expires_at)->format('d/m/Y') : 'Không hết hạn'
                ];
            })->toArray()
        ];
    }
}
