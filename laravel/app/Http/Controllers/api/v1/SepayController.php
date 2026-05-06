<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SepayController extends Controller
{
    /**
     * Handle SePay Webhook (Standard approach)
     */
    public function webhook(Request $request)
    {
        Log::info('SePay Webhook Received:', $request->all());

        $apiKey = config('services.sepay.api_key');
        if ($apiKey && $request->header('x-api-key') !== $apiKey) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $content = $request->input('content');
        $amount = $request->input('transferAmount');
        $description = $request->input('description');

        $orderCode = $this->extractOrderCode($content ?: $description);

        if (!$orderCode) {
            return response()->json(['status' => 'error', 'message' => 'Order code not found'], 400);
        }

        $normalizedTargetCode = str_replace('-', '', $orderCode);
        $order = Order::where('code', $orderCode)
            ->orWhereRaw("REPLACE(code, '-', '') = ?", [$normalizedTargetCode])
            ->first();

        if ($order && $order->payment_status !== 'paid') {
            $order->update([
                'payment_status' => 'paid',
                'status' => 'processing'
            ]);
            return response()->json(['status' => 'success', 'message' => 'Order updated']);
        }

        return response()->json(['status' => 'error', 'message' => 'Order not found or already paid'], 404);
    }

    /**
     * Real-time check status via SePay API (Backend Polling - Works on Localhost)
     * This mimics the Java project's behavior.
     */
    public function checkStatus(Request $request)
    {
        $orderCode = $request->query('orderCode');

        if (!$orderCode) {
            return response()->json(['status' => 'error', 'message' => 'Missing orderCode'], 400);
        }

        $apiKey = config('services.sepay.api_key');
        if (!$apiKey) {
            return response()->json(['status' => 'error', 'message' => 'SePay API Key not configured'], 500);
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->get('https://my.sepay.vn/userapi/transactions/list', [
                'limit' => 50,
            ]);

            if ($response->successful()) {
                $transactions = $response->json('transactions') ?? [];
                $normalizedTargetCode = strtoupper(str_replace('-', '', $orderCode));
                
                Log::info("SePay Polling: Checking for code $orderCode (Normalized: $normalizedTargetCode)");

                foreach ($transactions as $trans) {
                    // SePay có thể trả về 'content' hoặc 'transaction_content' tùy phiên bản API
                    $content = strtoupper($trans['content'] ?? $trans['transaction_content'] ?? '');
                    $sepayCode = strtoupper($trans['code'] ?? '');
                    
                    // Cách khớp lệnh "mềm dẻo" hơn: Chỉ cần nội dung CHỨA mã đơn hàng (đã bỏ dấu gạch ngang)
                    // Đây là cách các hệ thống Java chuyên nghiệp thường dùng để tránh lỗi do ngân hàng tự thêm bớt ký tự.
                    $isMatch = str_contains($content, $normalizedTargetCode) || str_contains($sepayCode, $normalizedTargetCode);
                    
                    if ($isMatch) {
                        Log::info("MATCH FOUND! Updating order $orderCode");
                        // Tìm đơn hàng bằng cách so khớp mã đã chuẩn hóa (loại bỏ dấu gạch ngang)
                        // Cách này đảm bảo tìm thấy đơn hàng dù $orderCode truyền lên có dấu gạch hay không.
                        $order = Order::whereRaw("REPLACE(code, '-', '') = ?", [$normalizedTargetCode])
                            ->first();

                        if ($order && $order->payment_status !== 'paid') {
                            $order->update([
                                'payment_status' => 'paid',
                                'status' => ($order->fulfillment_type === 'pickup') ? 'delivered' : 'processing'
                            ]);
                            return response()->json([
                                'status' => 'success',
                                'paid' => true,
                                'message' => 'Thanh toán thành công'
                            ]);
                        } else if ($order && $order->payment_status === 'paid') {
                            return response()->json([
                                'status' => 'success',
                                'paid' => true,
                                'message' => 'Đã thanh toán trước đó'
                            ]);
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error("SePay Check Status Error: " . $e->getMessage());
        }

        return response()->json([
            'status' => 'success',
            'paid' => false,
            'message' => 'Chưa nhận được thanh toán'
        ]);
    }

    private function extractOrderCode($text)
    {
        if (!$text) return null;
        if (preg_match('/ORD-\d{8}-[A-Z0-9]{6}/i', $text, $matches)) {
            return strtoupper($matches[0]);
        }
        if (preg_match('/ORD\d{8}[A-Z0-9]{6}/i', $text, $matches)) {
            return strtoupper($matches[0]);
        }
        return null;
    }
}
