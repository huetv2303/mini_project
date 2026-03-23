<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\InventoryTransactionResource;
use App\Services\InventoryService;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function index(Request $request)
    {
        $inventory = $this->inventoryService->getAll($request);
        return response()->json([
            'status' => 'success',
            'data'   => $inventory,
        ]);
    }


    public function show($variantId)
    {
        try {
            $inventory = $this->inventoryService->getByVariant($variantId);
            return response()->json([
                'status' => 'success',
                'data'   => $inventory,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Không tìm thấy tồn kho.',
            ], 404);
        }
    }

    public function report(Request $request)
    {
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);

        try {
            $data = $this->inventoryService->getMonthlyReport($month, $year);
            return response()->json([
                'status' => 'success',
                'data'   => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Lỗi khi lấy báo cáo: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function history($variantId, Request $request)
    {
        $history = $this->inventoryService->getHistory($variantId, $request);
        return response()->json([
            'status' => 'success',
            'data'   => InventoryTransactionResource::collection($history),
        ]);
    }

    public function adjust(Request $request)
    {
        $data = $request->validate([
            'variant_id'   => 'required|exists:product_variants,id',
            'new_quantity' => 'required|integer|min:0',
            'note'         => 'nullable|string',
        ]);

        try {
            $inventory = $this->inventoryService->adjust(
                $data['variant_id'],
                $data['new_quantity'],
                $data['note'] ?? null,
                auth()->id()
            );
            return response()->json([
                'status'  => 'success',
                'message' => 'Điều chỉnh tồn kho thành công.',
                'data'    => $inventory,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }


    public function import(Request $request)
    {
        $data = $request->validate([
            'variant_id'   => 'required|exists:product_variants,id',
            'quantity'     => 'required|integer|min:1',
            'note'         => 'nullable|string',
        ]);

        try {
            $inventory = $this->inventoryService->increaseStock(
                $data['variant_id'],
                $data['quantity'],
                'manual',
                null,
                auth()->id(),
                $data['note'] ?? 'Nhập kho thủ công'
            );
            return response()->json([
                'status'  => 'success',
                'message' => 'Nhập kho thành công.',
                'data'    => $inventory,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function lowStock()
    {
        $items = $this->inventoryService->getLowStock();
        return response()->json([
            'status' => 'success',
            'data'   => $items,
        ]);
    }
}
