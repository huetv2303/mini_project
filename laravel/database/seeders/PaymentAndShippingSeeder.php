<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PaymentMethod;
use App\Models\ShippingMethod;
use Illuminate\Support\Facades\DB;

class PaymentAndShippingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        PaymentMethod::truncate();
        ShippingMethod::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Seed Payment Methods (cod, bank_transfer, vnpay)
        $paymentMethods = [
            [
                'name' => 'Thanh toán COD (Tiền mặt khi nhận hàng)',
                'code' => 'cod',
                'description' => 'Thanh toán bằng tiền mặt trực tiếp cho nhân viên giao hàng khi nhận hàng.',
                'image' => 'payment_methods/wWlb1eiRF3RUeL70N9QLGkEwLKoBqEsVB4BLPeKN.jpg',
                'is_active' => true,
            ],
            [
                'name' => 'Chuyển khoản Ngân hàng (Auto-matching)',
                'code' => 'bank_transfer',
                'description' => 'Chuyển khoản nhanh qua mã QR. Hệ thống tự động kiểm tra giao dịch và xác nhận đơn hàng sau 1-2 phút.',
                'image' => 'payment_methods/yxySSiFocdU2N7W7EIisPde1PmiCm1RGflRe4i0K.jpg',
                'is_active' => true,
            ],
            [
                'name' => 'Cổng thanh toán VNPay',
                'code' => 'vnpay',
                'description' => 'Thanh toán trực tuyến an toàn qua Ví điện tử VNPay, Thẻ ATM nội địa, Thẻ quốc tế Visa/Mastercard.',
                'image' => 'payment_methods/5tjyynzJCRpDpD1eYyBSRJOIKgoKVbh1dKxyQ1Pz.png',
                'is_active' => true,
            ],
        ];

        foreach ($paymentMethods as $pm) {
            PaymentMethod::create($pm);
        }

        // Seed Shipping Methods (Standard, Express)
        $shippingMethods = [
            [
                'name' => 'Giao hàng tiêu chuẩn (GHN/GHTK)',
                'cost' => 30000.00,
                'estimated_days' => 3,
                'is_active' => true,
            ],
            [
                'name' => 'Giao hàng hỏa tốc (AhaMove/GrabExpress)',
                'cost' => 55000.00,
                'estimated_days' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Miễn phí vận chuyển (Ưu đãi)',
                'cost' => 0.00,
                'estimated_days' => 4,
                'is_active' => true,
            ]
        ];

        foreach ($shippingMethods as $sm) {
            ShippingMethod::create($sm);
        }
    }
}
