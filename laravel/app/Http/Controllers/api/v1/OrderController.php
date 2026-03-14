<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Requests\Order\UpdateOrderRequest;
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
        $orders = $this->orderService->getAll($request);
        return response()->json([
            'status' => 'success',
            'data'   => OrderResource::collection($orders),
        ]);
    }

    public function store(StoreOrderRequest $request)
    {
        try {
            $data  = $request->validated();
            $order = $this->orderService->createOrder($data, auth()->id());
            return response()->json([
                'status'  => 'success',
                'message' => 'Tạo đơn hàng thành công.',
                'data'    => new OrderResource($order),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function show($id)
    {
        try {
            $order = $this->orderService->findById($id);
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

    public function update(UpdateOrderRequest $request, $id)
    {
        try {
            $order = $this->orderService->updateOrder($id, $request->validated());
            $order->load(['paymentMethod', 'staff', 'items']);
            return response()->json([
                'status'  => 'success',
                'message' => 'Cập nhật đơn hàng thành công.',
                'data'    => new OrderResource($order),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function cancel($id)
    {
        try {
            $order = $this->orderService->cancelOrder($id);
            return response()->json([
                'status'  => 'success',
                'message' => 'Đơn hàng đã được hủy và tồn kho đã được hoàn trả.',
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
