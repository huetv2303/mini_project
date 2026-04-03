<?php

namespace App\Http\Controllers\api\v1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Services\OrderService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    protected $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    public function index(Request $request)
    {
        // Force customer_id filter to current authenticated user
        $request->merge(['customer_id' => auth()->id()]);

        $orders = $this->orderService->getAll($request);

        return OrderResource::collection($orders)->additional(['status' => 'success']);
    }

    public function show($id)
    {
        try {
            $order = $this->orderService->findById($id);

            if ($order->customer_id !== auth()->id()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Bạn không có quyền xem đơn hàng này.',
                ], 403);
            }

            return response()->json([
                'status' => 'success',
                'data'   => new OrderResource($order),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Không tìm thấy đơn hàng.',
            ], 404);
        }
    }

    public function cancel($id)
    {
        try {
            $order = $this->orderService->findById($id);

            if ($order->customer_id !== auth()->id()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Bạn không có quyền hủy đơn hàng này.',
                ], 403);
            }

            if ($order->status !== 'pending') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Chỉ có thể hủy đơn hàng đang chờ xác nhận.',
                ], 422);
            }

            $order = $this->orderService->cancelOrder($id);
            return response()->json([
                'status'  => 'success',
                'message' => 'Đơn hàng đã được hủy thành công.',
                'data'    => new OrderResource($order),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
