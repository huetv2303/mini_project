<?php

namespace App\Http\Controllers\api\v1\Storefront;

use App\Http\Controllers\Controller;
use App\Interfaces\Order\CheckoutRepositoryInterface;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    protected $checkoutRepo;

    public function __construct(CheckoutRepositoryInterface $checkoutRepo)
    {
        $this->checkoutRepo = $checkoutRepo;
    }

    /**
     * Đặt hàng - hỗ trợ 2 luồng: cart và buynow
     *
     * POST /api/v1/storefront/checkout
     */
    public function checkout(Request $request)
    {
        $mode = $request->input('mode', 'cart');

        $commonRules = [
            'mode'              => 'required|in:cart,buynow',
            'customer_name'     => 'required|string|max:255',
            'customer_phone'    => 'required|string|max:20',
            'address'           => 'required|string|max:500',
            'shipping_method_id' => 'required|exists:shipping_methods,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'discount_amount'   => 'nullable|numeric|min:0',
            'promotion_id'      => 'nullable|exists:promotions,id',
            'note'              => 'nullable|string|max:500',
        ];

        $modeRules = $mode === 'buynow'
            ? [
                'product_variant_id' => 'required|exists:product_variants,id',
                'quantity'           => 'required|integer|min:1',
            ]
            : [
                'items'                          => 'required|array|min:1',
                'items.*.product_variant_id'     => 'required|exists:product_variants,id',
                'items.*.quantity'               => 'required|integer|min:1',
            ];

        $request->validate(array_merge($commonRules, $modeRules));

        try {
            $paymentMethod = \App\Models\PaymentMethod::findOrFail($request->payment_method_id);

            // Xử lý ví điện tử VNPay - KHÔNG tạo đơn ngay lập tức
            if ($paymentMethod->code === 'vnpay') {
                $summary = $this->checkoutRepo->calculateSummary($request);
                $paymentSessionCode = 'SES-' . strtoupper(\Illuminate\Support\Str::random(10));

                // Lưu thông tin đặt hàng vào Cache để dùng khi VNPay gọi callback/IPN
                \Illuminate\Support\Facades\Cache::put($paymentSessionCode, $request->all(), now()->addHours(2));

                $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
                $returnUrl = rtrim($frontendUrl, '/') . '/checkout/vnpay-callback';

                $paymentUrl = app(\App\Services\Payment\VNPayService::class)->generatePaymentUrl(
                    $summary['final_amount'],
                    $paymentSessionCode,
                    $returnUrl
                );

                return response()->json([
                    'status'  => 'success',
                    'message' => 'Chuyển hướng đến cổng thanh toán...',
                    'payment_url' => $paymentUrl,
                ], 200);
            }

            $order = $this->checkoutRepo->checkout($request);
            $bankInfo = null;

            if ($paymentMethod->code === 'bank_transfer') {
                $bankInfo = [
                    'bank_id' => config('bank.bank_id'),
                    'account_no' => config('bank.account_no'),
                    'account_name' => config('bank.account_name'),
                    'amount' => $order->final_amount,
                    'order_code' => $order->code,
                ];
            }

            return response()->json([
                'status'  => 'success',
                'message' => 'Đặt hàng thành công!',
                'data'    => $order,
                'bank_info' => $bankInfo,
            ], 201);
        } catch (\Exception $e) {


            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
