<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStockReceiptRequest;
use App\Services\StockReceiptService;
use Illuminate\Http\Request;

class StockReceiptController extends Controller
{
    protected $stockReceiptService;

    public function __construct(StockReceiptService $stockReceiptService)
    {
        $this->stockReceiptService = $stockReceiptService;
    }

    public function index()
    {
        $receipts = $this->stockReceiptService->getAll();
        return response()->json([
            'status' => 'success',
            'data'   => $receipts,
        ]);
    }

    public function store(StoreStockReceiptRequest $request)
    {
        $data = $request->validated();

        try {
            $receipt = $this->stockReceiptService->create($data);
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

    public function show($id)
    {
        $receipt = $this->stockReceiptService->getById($id);
        if (!$receipt) {
            return response()->json(['status' => 'error', 'message' => 'Không tìm thấy phiếu nhập.'], 404);
        }
        return response()->json(['status' => 'success', 'data' => $receipt]);
    }

    public function confirm($id)
    {
        try {
            $receipt = $this->stockReceiptService->confirm($id);
            return response()->json([
                'status'  => 'success',
                'message' => 'Nhập kho thành công.',
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
