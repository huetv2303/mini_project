<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderReturnResource;
use App\Services\OrderReturnService;
use Illuminate\Http\Request;

class OrderReturnController extends Controller
{
    protected $orderReturnService;

    public function __construct(OrderReturnService $orderReturnService)
    {
        $this->orderReturnService = $orderReturnService;
    }

    public function index(Request $request)
    {
        $returns = $this->orderReturnService->getAll($request);
        return OrderReturnResource::collection($returns)->additional(['status' => 'success']);
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'order_id'            => 'required|exists:orders,id',
                'reason'              => 'nullable|string',
                'items'               => 'required|array|min:1',
                'items.*.order_item_id' => 'required|exists:order_items,id',
                'items.*.quantity'     => 'required|integer|min:1',
            ]);

            $orderReturn = $this->orderReturnService->processReturn($data, auth()->id());

            return response()->json([
                'status'  => 'success',
                'message' => 'Xử lý trả hàng thành công.',
                'data'    => new OrderReturnResource($orderReturn),
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
            $orderReturn = $this->orderReturnService->findById($id);
            return OrderReturnResource::make($orderReturn)->additional(['status' => 'success']);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Không tìm thấy phiếu trả hàng.',
            ], 404);
        }
    }

    public function receive($id)
    {
        try {
            $orderReturn = $this->orderReturnService->receiveStock($id, auth()->id());
            return OrderReturnResource::make($orderReturn)->additional([
                'status'  => 'success',
                'message' => 'Nhận hàng và hoàn kho thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function refund($id)
    {
        try {
            $orderReturn = $this->orderReturnService->refundMoney($id, auth()->id());
            return OrderReturnResource::make($orderReturn)->additional([
                'status'  => 'success',
                'message' => 'Xác nhận hoàn tiền thành công.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function bulkRefund(Request $request)
    {
        try {
            $data = $request->validate([
                'ids' => 'required|array',
                'ids.*' => 'exists:order_returns,id',
            ]);

            $updatedCount = $this->orderReturnService->bulkRefund($data['ids'], auth()->id());

            return response()->json([
                'status'  => 'success',
                'message' => 'Xác nhận hoàn tiền hàng loạt thành công.',
                'updated_count' => $updatedCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
