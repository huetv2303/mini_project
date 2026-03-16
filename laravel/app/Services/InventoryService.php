<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\InventoryTransaction;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    /**
     * Xem tổng quan tồn kho (tất cả variants)
     */
    public function getAll($request = null)
    {
        $query = Inventory::with(['variant.product'])
            ->orderBy('quantity', 'asc');

        if ($request && $request->low_stock) {
            // Lọc hàng sắp hết (quantity <= min_quantity)
            $query->whereColumn('quantity', '<=', 'min_quantity');
        }

        return $query->paginate(15);
    }

    /**
     * Xem tồn kho theo variant_id
     */
    public function getByVariant($variantId)
    {
        return Inventory::with(['variant.product'])
            ->where('variant_id', $variantId)
            ->firstOrFail();
    }

    /**
     * Xem lịch sử biến động của 1 variant
     */
    public function getHistory($variantId, $request = null)
    {
        $query = InventoryTransaction::with(['variant', 'createdBy'])
            ->where('variant_id', $variantId)
            ->latest('created_at');

        if ($request && $request->type) {
            $query->where('type', $request->type);
        }

        return $query->paginate(20);
    }

    /**
     * Điều chỉnh tồn kho thủ công (kiểm kê)
     */
    public function adjust($variantId, $newQuantity, $note, $userId)
    {
        return DB::transaction(function () use ($variantId, $newQuantity, $note, $userId) {
            $inventory = Inventory::where('variant_id', $variantId)->firstOrFail();

            $before = $inventory->quantity;
            $change = $newQuantity - $before;

            $inventory->update(['quantity' => $newQuantity]);

            InventoryTransaction::create([
                'variant_id'      => $variantId,
                'type'            => 'adjustment',
                'reference_type'  => 'manual',
                'reference_id'    => null,
                'quantity_before' => $before,
                'quantity_change' => $change,
                'quantity_after'  => $newQuantity,
                'note'            => $note ?? 'Điều chỉnh tồn kho thủ công',
                'created_by'      => $userId,
            ]);

            return $inventory->fresh(['variant.product']);
        });
    }

    /**
     * Danh sách hàng sắp hết theo ngưỡng min_quantity
     */
    public function getLowStock()
    {
        return Inventory::with(['variant.product'])
            ->whereColumn('quantity', '<=', 'min_quantity')
            ->orderBy('quantity', 'asc')
            ->get();
    }
}
