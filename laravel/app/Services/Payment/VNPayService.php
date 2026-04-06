<?php

namespace App\Services\Payment;

use App\Models\Order;
use Exception;
use Illuminate\Support\Facades\Log;

class VNPayService
{
    /**
     * Generate VNPay Payment URL
     * Support both Order model and raw session data
     */
    public function generatePaymentUrl($amount, $code, $returnUrl = null)
    {
        $vnp_Url = config('vnpay.url');
        $vnp_Returnurl = $returnUrl ?? config('vnpay.return_url');

        $vnp_TmnCode = config('vnpay.tmn_code');
        $vnp_HashSecret = config('vnpay.hash_secret');

        $vnp_TxnRef = $code . '-' . time();
        $vnp_OrderInfo = "Thanh toan don hang " . $code;
        $vnp_OrderType = 'billpayment';
        $vnp_Amount = $amount * 100;
        $vnp_Locale = 'vn';
        $vnp_IpAddr = request()->ip();

        $inputData = array(
            "vnp_Version" => "2.1.0",
            "vnp_TmnCode" => $vnp_TmnCode,
            "vnp_Amount" => $vnp_Amount,
            "vnp_Command" => "pay",
            "vnp_CreateDate" => date('YmdHis'),
            "vnp_CurrCode" => "VND",
            "vnp_IpAddr" => $vnp_IpAddr,
            "vnp_Locale" => $vnp_Locale,
            "vnp_OrderInfo" => $vnp_OrderInfo,
            "vnp_OrderType" => $vnp_OrderType,
            "vnp_ReturnUrl" => $vnp_Returnurl,
            "vnp_TxnRef" => $vnp_TxnRef,
        );


        ksort($inputData);
        $query = "";
        $i = 0;
        $hashdata = "";
        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $hashdata .= '&' . urlencode($key) . "=" . urlencode($value);
            } else {
                $hashdata .= urlencode($key) . "=" . urlencode($value);
                $i = 1;
            }
            $query .= urlencode($key) . "=" . urlencode($value) . '&';
        }

        $vnp_Url = $vnp_Url . "?" . $query;
        if (isset($vnp_HashSecret)) {
            $vnpSecureHash = hash_hmac('sha512', $hashdata, $vnp_HashSecret);
            $vnp_Url .= 'vnp_SecureHash=' . $vnpSecureHash;
        }

        return $vnp_Url;
    }

    public function handleIpn($requestData, $updateOrderCallback)
    {
        $vnp_HashSecret = config('vnpay.hash_secret');
        $vnp_SecureHash = $requestData['vnp_SecureHash'] ?? '';

        unset($requestData['vnp_SecureHash']);
        unset($requestData['vnp_SecureHashType']);

        ksort($requestData);
        $hashData = "";
        $i = 0;

        foreach ($requestData as $key => $value) {
            if ($i == 1) {
                $hashData = $hashData . '&' . urlencode($key) . "=" . urlencode($value);
            } else {
                $hashData = $hashData . urlencode($key) . "=" . urlencode($value);
                $i = 1;
            }
        }

        $secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

        if ($secureHash == $vnp_SecureHash) {
            $txnRef = $requestData['vnp_TxnRef'] ?? '';
            $lastHyphenPos = strrpos($txnRef, '-');
            $orderCode = $lastHyphenPos !== false ? substr($txnRef, 0, $lastHyphenPos) : $txnRef;

            $amount = ($requestData['vnp_Amount'] ?? 0) / 100;
            $responseCode = $requestData['vnp_ResponseCode'] ?? '';

            $order = Order::where('code', $orderCode)->first();

            if ($order) {
                if (abs($order->final_amount - $amount) < 1) {
                    if ($order->payment_status !== 'paid') {
                        if ($responseCode == '00') {
                            $updateOrderCallback($order, 'paid');
                            return ['RspCode' => '00', 'Message' => 'Confirm Success'];
                        } else {
                            return ['RspCode' => '00', 'Message' => 'Transaction Failed'];
                        }
                    } else {
                        return ['RspCode' => '02', 'Message' => 'Order already confirmed'];
                    }
                } else {
                    Log::error("VNPay Amount Mismatch: Order amount: {$order->final_amount}, VNPay amount: {$amount}");
                    return ['RspCode' => '04', 'Message' => 'invalid amount'];
                }
            } else {
                if (str_starts_with($orderCode, 'SES-') && $responseCode == '00') {
                    $updateOrderCallback(null, 'paid');
                    return ['RspCode' => '00', 'Message' => 'Confirm Success (Session)'];
                }
                Log::error("VNPay Order Not Found: Code: {$orderCode}");
                return ['RspCode' => '01', 'Message' => 'Order not found'];
            }
        } else {
            Log::error("VNPay Signature Mismatch!");
            Log::error("Calculated Hash: " . $secureHash);
            Log::error("Received Hash: " . $vnp_SecureHash);
            Log::error("Hash Data string: " . $hashData);
            return ['RspCode' => '97', 'Message' => 'Invalid signature'];
        }
    }
}
