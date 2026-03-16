<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Services\InventoryService;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Tổng quan tồn kho tất cả variants
     */
    public function index(Request $request)
    {
        $inventory = $this->inventoryService->getAll($request);
        return response()->json([
            'status' => 'success',
            'data'   => $inventory,
        ]);
    }

    /**
     * Tồn kho theo variant_id
     */
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

    /**
     * Lịch sử biến động tồn kho của 1 variant
     */
    public function history($variantId, Request $request)
    {
        $history = $this->inventoryService->getHistory($variantId, $request);
        return response()->json([
            'status' => 'success',
            'data'   => $history,
        ]);
    }

    /**
     * Điều chỉnh tồn kho thủ công (kiểm kê)
     */
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

    /**
     * Danh sách hàng sắp hết (quantity <= min_quantity)
     */
    public function lowStock()
    {
        $items = $this->inventoryService->getLowStock();
        return response()->json([
            'status' => 'success',
            'data'   => $items,
        ]);
    }
}
