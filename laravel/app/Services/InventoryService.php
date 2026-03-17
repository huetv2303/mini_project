<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\InventoryTransaction;
use Illuminate\Support\Facades\DB;

class InventoryService
{

    public function increaseStock($variantId, $quantity, $refType, $refId, $userId, $note = null)
    {
        return DB::transaction(function () use ($variantId, $quantity, $refType, $refId, $userId, $note) {
            $inventory = Inventory::firstOrCreate(
                ['variant_id' => $variantId],
                ['quantity' => 0, 'reserved' => 0]
            );

            $qtyBefore = $inventory->quantity;

            $inventory->increment('quantity', $quantity);

            return InventoryTransaction::create([
                'variant_id' => $variantId,
                'type' => 'in',
                'reference_type' => $refType,
                'reference_id' => $refId,
                'quantity_before' => $qtyBefore,
                'quantity_change' => $quantity,
                'quantity_after' => $qtyBefore + $quantity,
                'user_id' => $userId,
                'note' => $note,
            ]);
        });
    }

    public function decreaseStock($variantId, $quantity, $refType, $refId, $userId, $note = null)
    {
        return DB::transaction(function () use ($variantId, $quantity, $refType, $refId, $userId, $note) {
            $inventory = Inventory::where('variant_id', $variantId)->first();

            if (!$inventory || $inventory->quantity < $quantity) {
                throw new \Exception("Không đủ tồn kho để thực hiện giao dịch này.");
            }

            $inventory->decrement("quantity", $quantity);

            return InventoryTransaction::create([
                'variant_id' => $variantId,
                'type' => 'out',
                'reference_type' => $refType,
                'reference_id' => $refId,
                'quantity_before' => $inventory->quantity + $quantity,
                'quantity_change' => $quantity,
                'quantity_after' => $inventory->quantity,
                'user_id' => $userId,
                'note' => $note,
            ]);
        });
    }
}
