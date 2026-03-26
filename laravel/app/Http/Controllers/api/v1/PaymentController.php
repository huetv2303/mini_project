<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Services\Payment\VNPayService;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    protected $vnPayService;

    public function __construct(VNPayService $vnPayService)
    {
        $this->vnPayService = $vnPayService;
    }

    public function vnpayCreate(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
        ]);

        $order = Order::findOrFail($request->order_id);

        if ($order->payment_status === 'paid') {
            return response()->json([
                'status' => 'error',
                'message' => 'Đơn hàng này đã được thanh toán.',
            ], 400);
        }

        $url = $this->vnPayService->generatePaymentUrl($order);

        return response()->json([
            'status' => 'success',
            'data' => [
                'payment_url' => $url,
            ],
        ]);
    }

    public function vnpayIpn(Request $request)
    {
        $inputData = $request->all();
        
        $result = $this->vnPayService->handleIpn($inputData, function ($order, $status) {
            $order->update([
                'payment_status' => $status,
                'status' => $status === 'paid' ? 'processing' : $order->status
            ]);
        });

        return response()->json($result);
    }

    public function vnpayVerify(Request $request)
    {
        $inputData = $request->all();
        
        $result = $this->vnPayService->handleIpn($inputData, function ($order, $status) {
            $order->update([
                'payment_status' => $status,
                'status' => $status === 'paid' ? 'processing' : $order->status
            ]);
        });

        if ($result['RspCode'] === '00' || $result['RspCode'] === '02') {
             return response()->json([
                'status' => 'success',
                'message' => $result['Message'] ?? 'Thanh toán thành công.',
                'data' => $result
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => $result['Message'],
            'data' => $result
        ], 400);
    }

    public function bankConfig()
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'bank_id' => config('bank.bank_id', '970436'), // VCB by default
                'account_no' => config('bank.account_no', '1111111111'),
                'account_name' => config('bank.account_name', 'NGUYEN VAN A'),
            ]
        ]);
    }
}
