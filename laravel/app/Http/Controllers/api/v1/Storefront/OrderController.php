<?php

namespace App\Http\Controllers\api\v1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\OrderReturnResource;
use App\Services\OrderService;
use App\Services\OrderReturnService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    protected $orderService;
    protected $orderReturnService;

    public function __construct(OrderService $orderService, OrderReturnService $orderReturnService)
    {
        $this->orderService = $orderService;
        $this->orderReturnService = $orderReturnService;
    }

    public function index(Request $request)
    {
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

    public function return(Request $request, $id)
    {
        try {
            $order = $this->orderService->findById($id);

            if ($order->customer_id !== auth()->id()) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Bạn không có quyền thực hiện thao tác này.',
                ], 403);
            }

            $data = $request->validate([
                'reason'               => 'nullable|string|max:1000',
                'items'                => 'required|array|min:1',
                'items.*.order_item_id' => 'required|exists:order_items,id',
                'items.*.quantity'      => 'required|integer|min:1',
            ]);

            $data['order_id'] = $order->id;

            $orderReturn = $this->orderReturnService->processReturn($data, auth()->id());

            return response()->json([
                'status'  => 'success',
                'message' => 'Yêu cầu trả hàng đã được gửi thành công.',
                'data'    => new OrderReturnResource($orderReturn),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
