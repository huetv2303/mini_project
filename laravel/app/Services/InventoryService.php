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
        $query = InventoryTransaction::with(['variant.product', 'createdBy'])
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
                'user_id'      => $userId,
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

    /**
     * Tăng tồn kho (Khi nhập hàng hoặc huỷ đơn)
     */
    public function increaseStock($variantId, $quantity, $referenceType, $referenceId, $userId, $note = null)
    {
        return DB::transaction(function () use ($variantId, $quantity, $referenceType, $referenceId, $userId, $note) {
            $inventory = Inventory::firstOrCreate(
                ['variant_id' => $variantId],
                ['quantity' => 0, 'min_quantity' => 5]
            );

            $before = $inventory->quantity;
            $after  = $before + $quantity;

            $inventory->increment('quantity', $quantity);

            InventoryTransaction::create([
                'variant_id'      => $variantId,
                'type'            => 'in',
                'reference_type'  => $referenceType,
                'reference_id'    => $referenceId,
                'quantity_before' => $before,
                'quantity_change' => $quantity,
                'quantity_after'  => $after,
                'note'            => $note,
                'user_id'         => $userId,
            ]);

            return $inventory->fresh(['variant.product']);
        });
    }

    /**
     * Giảm tồn kho (Khi bán hàng hoặc trả hàng cho NCC)
     */
    public function decreaseStock($variantId, $quantity, $referenceType, $referenceId, $userId, $note = null)
    {
        return DB::transaction(function () use ($variantId, $quantity, $referenceType, $referenceId, $userId, $note) {
            $inventory = Inventory::where('variant_id', $variantId)->lockForUpdate()->firstOrFail();

            if ($inventory->quantity < $quantity) {
                throw new \Exception("Không đủ hàng trong kho cho biến thể ID: {$variantId}");
            }

            $before = $inventory->quantity;
            $after  = $before - $quantity;

            $inventory->decrement('quantity', $quantity);

            InventoryTransaction::create([
                'variant_id'      => $variantId,
                'type'            => 'out',
                'reference_type'  => $referenceType,
                'reference_id'    => $referenceId,
                'quantity_before' => $before,
                'quantity_change' => -$quantity,
                'quantity_after'  => $after,
                'note'            => $note,
                'user_id'         => $userId,
            ]);

            return $inventory->fresh(['variant.product']);
        });
    }
}
