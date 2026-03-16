<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Services\StockReceiptService;
use Illuminate\Http\Request;

class StockReceiptController extends Controller
{
    protected $receiptService;

    public function __construct(StockReceiptService $receiptService)
    {
        $this->receiptService = $receiptService;
    }

    /**
     * Danh sách phiếu nhập kho
     */
    public function index(Request $request)
    {
        $receipts = $this->receiptService->getAll($request);
        return response()->json([
            'status' => 'success',
            'data'   => $receipts,
        ]);
    }

    /**
     * Chi tiết phiếu nhập kho
     */
    public function show($id)
    {
        try {
            $receipt = $this->receiptService->findById($id);
            return response()->json([
                'status' => 'success',
                'data'   => $receipt,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Không tìm thấy phiếu nhập kho.',
            ], 404);
        }
    }

    /**
     * Tạo phiếu nhập kho mới (status: pending)
     */
    public function store(Request $request)
    {
        // TODO: Tách thành StoreStockReceiptRequest
        $data = $request->validate([
            'supplier_id'           => 'required|exists:suppliers,id',
            'note'                  => 'nullable|string',
            'received_at'           => 'nullable|date',
            'items'                 => 'required|array|min:1',
            'items.*.variant_id'    => 'required|exists:product_variants,id',
            'items.*.quantity'      => 'required|integer|min:1',
            'items.*.unit_price'    => 'required|numeric|min:0',
        ]);

        try {
            $receipt = $this->receiptService->createReceipt($data, auth()->id());
            return response()->json([
                'status'  => 'success',
                'message' => 'Tạo phiếu nhập kho thành công.',
                'data'    => $receipt,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Xác nhận phiếu nhập → cộng tồn kho
     */
    public function confirm($id)
    {
        try {
            $receipt = $this->receiptService->confirmReceipt($id, auth()->id());
            return response()->json([
                'status'  => 'success',
                'message' => 'Xác nhận nhập kho thành công. Tồn kho đã được cập nhật.',
                'data'    => $receipt,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Huỷ phiếu nhập kho
     */
    public function cancel($id)
    {
        try {
            $receipt = $this->receiptService->cancelReceipt($id);
            return response()->json([
                'status'  => 'success',
                'message' => 'Phiếu nhập kho đã được huỷ.',
                'data'    => $receipt,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
