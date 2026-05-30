<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Promotion;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PromotionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Promotion::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $promotions = [
            [
                'code' => 'WELCOME50',
                'name' => 'Ưu đãi Khách hàng Mới',
                'description' => 'Giảm ngay 50.000đ cho đơn hàng đầu tiên từ 250.000đ trở lên.',
                'type' => 'fixed',
                'value' => 50000.00,
                'scope' => 'all',
                'applies_to' => 'all',
                'min_order_amount' => 250000.00,
                'max_discount_amount' => 50000.00,
                'usage_limit' => 1000,
                'usage_limit_per_user' => 1,
                'used_count' => 0,
                'starts_at' => Carbon::now()->subDays(5),
                'expires_at' => Carbon::now()->addDays(90),
                'is_active' => true,
            ],
            [
                'code' => 'SUMMER10',
                'name' => 'Chào Hè Rực Rỡ',
                'description' => 'Giảm 10% cho tất cả các mặt hàng thời trang hè. Tối đa 50.000đ.',
                'type' => 'percent',
                'value' => 10.00,
                'scope' => 'all',
                'applies_to' => 'all',
                'min_order_amount' => 150000.00,
                'max_discount_amount' => 50000.00,
                'usage_limit' => 500,
                'usage_limit_per_user' => 2,
                'used_count' => 0,
                'starts_at' => Carbon::now()->subDays(2),
                'expires_at' => Carbon::now()->addDays(30),
                'is_active' => true,
            ],
            [
                'code' => 'FREESHIP30',
                'name' => 'Miễn Phí Vận Chuyển Toàn Quốc',
                'description' => 'Giảm tối đa 30.000đ phí vận chuyển cho hóa đơn từ 200.000đ.',
                'type' => 'fixed',
                'value' => 30000.00,
                'scope' => 'all',
                'applies_to' => 'website',
                'min_order_amount' => 200000.00,
                'max_discount_amount' => 30000.00,
                'usage_limit' => 2000,
                'usage_limit_per_user' => 3,
                'used_count' => 0,
                'starts_at' => Carbon::now()->subDays(1),
                'expires_at' => Carbon::now()->addDays(60),
                'is_active' => true,
            ],
            [
                'code' => 'VIPFASHION',
                'name' => 'Tri Ân Khách Hàng Thân Thiết',
                'description' => 'Giảm giá cực khủng 15% cho hóa đơn từ 500.000đ trở lên. Không giới hạn mức giảm tối đa.',
                'type' => 'percent',
                'value' => 15.00,
                'scope' => 'all',
                'applies_to' => 'all',
                'min_order_amount' => 500000.00,
                'max_discount_amount' => null,
                'usage_limit' => 200,
                'usage_limit_per_user' => 1,
                'used_count' => 0,
                'starts_at' => Carbon::now()->subDays(10),
                'expires_at' => Carbon::now()->addDays(365),
                'is_active' => true,
            ],
            [
                'code' => 'MIDYEAR20',
                'name' => 'Siêu Sale Giữa Năm',
                'description' => 'Giảm ngay 20% cho toàn bộ đơn hàng trong đợt Mega Sale. Giảm tối đa 100.000đ.',
                'type' => 'percent',
                'value' => 20.00,
                'scope' => 'all',
                'applies_to' => 'all',
                'min_order_amount' => 300000.00,
                'max_discount_amount' => 100000.00,
                'usage_limit' => 300,
                'usage_limit_per_user' => 1,
                'used_count' => 0,
                'starts_at' => Carbon::now()->subDays(1),
                'expires_at' => Carbon::now()->addDays(15),
                'is_active' => true,
            ],
        ];

        foreach ($promotions as $promo) {
            Promotion::create($promo);
        }
    }
}
