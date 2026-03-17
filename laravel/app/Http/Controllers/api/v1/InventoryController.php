<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index()
    {
        // Xem danh sách tồn kho hiện tại
        $inventory = Inventory::with('variant.product')->get();

        return response()->json([
            'status' => 'success',
            'data'   => $inventory,
        ]);
    }

    public function history($variantId)
    {
        // Xem lịch sử biến động cho 1 variant
        $history = InventoryTransaction::with('user')
            ->where('variant_id', $variantId)
            ->latest('created_at')
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $history,
        ]);
    }
}
