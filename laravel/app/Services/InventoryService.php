<?php

namespace App\Services;

use App\Models\Inventory;
use Illuminate\Support\Facades\DB;
use App\Models\InventoryTransaction;

class InventoryService
{
    public function getAll($request = null)
    {
        $query = Inventory::with(['variant.product', 'variant.attributes']);

        if ($request && $request->status) {
            if ($request->status === 'out_of_stock') {
                $query->where('quantity', '<=', 0);
            } elseif ($request->status === 'low_stock') {
                $query->whereColumn('quantity', '<', 'min_quantity')->where('quantity', '>', 0);
            }
        }

        if ($request && $request->has_min_stock) {
            $query->whereColumn('quantity', '<=', 'min_quantity');
        }

        return $query->paginate(5);
    }


    public function getByVariant($variantId)
    {
        return Inventory::where('variant_id', $variantId)->with(['variant.product'])->firstOrFail();
    }

    public function getHistory($variantId, $request = null)
    {
        $query = InventoryTransaction::where('variant_id', $variantId)->orderBy('created_at', 'desc');

        if ($request && $request->type) {
            $query->where('type', $request->type);
        }

        return $query->paginate(20);
    }

    public function adjust($variantId, $newQuantity, $note, $userId)
    {
        return DB::transaction(function () use ($variantId, $newQuantity, $note, $userId) {
            $inventory = Inventory::where('variant_id', $variantId)->lockForUpdate()->firstOrFail();
            $before = $inventory->quantity;
            $change = $newQuantity - $before;

            $inventory->update(['quantity' => $newQuantity]);

            InventoryTransaction::create([
                'variant_id'      => $variantId,
                'user_id'         => $userId,
                'type'            => 'adjustment',
                'quantity_before' => $before,
                'quantity_change' => $change,
                'quantity_after'  => $newQuantity,
                'note'            => $note ?? 'Điều chỉnh tồn kho thủ công',
            ]);

            return $inventory;
        });
    }

    public function increaseStock($variantId, $quantity, $type = 'in', $referenceId = null, $userId = null, $note = null, $referenceType = null)
    {
        return DB::transaction(function () use ($variantId, $quantity, $type, $referenceId, $userId, $note, $referenceType) {
            $inventory = Inventory::where('variant_id', $variantId)->lockForUpdate()->firstOrFail();
            $before = $inventory->quantity;
            $after = $before + $quantity;

            $inventory->update(['quantity' => $after]);

            InventoryTransaction::create([
                'variant_id'      => $variantId,
                'user_id'         => $userId,
                'type'            => $type,
                'reference_type'  => $referenceType,
                'reference_id'    => $referenceId,
                'quantity_before' => $before,
                'quantity_change' => $quantity,
                'quantity_after'  => $after,
                'note'            => $note,
            ]);

            return $inventory;
        });
    }

    public function decreaseStock($variantId, $quantity, $type = 'out', $referenceId = null, $userId = null, $note = null, $referenceType = null)
    {
        return DB::transaction(function () use ($variantId, $quantity, $type, $referenceId, $userId, $note, $referenceType) {
            $inventory = Inventory::where('variant_id', $variantId)->lockForUpdate()->firstOrFail();

            if ($inventory->quantity < $quantity) {
                throw new \Exception("Không đủ hàng trong kho cho biến thể ID: {$variantId}");
            }

            $before = $inventory->quantity;
            $after  = $before - $quantity;

            $inventory->decrement('quantity', $quantity);

            InventoryTransaction::create([
                'variant_id'      => $variantId,
                'user_id'         => $userId,
                'type'            => $type,
                'reference_type'  => $referenceType,
                'reference_id'    => $referenceId,
                'quantity_before' => $before,
                'quantity_change' => -$quantity,
                'quantity_after'  => $after,
                'note'            => $note,
            ]);

            return $inventory->fresh(['variant.product']);
        });
    }

    public function reserveStock($variantId, $quantity)
    {
        return DB::transaction(function () use ($variantId, $quantity) {
            $inventory = Inventory::where('variant_id', $variantId)->lockForUpdate()->firstOrFail();

            if (($inventory->quantity - $inventory->reserved) < $quantity) {
                throw new \Exception("Không đủ hàng khả dụng (sau khi trừ đã đặt) cho biến thể ID: {$variantId}");
            }

            $inventory->increment('reserved', $quantity);

            return $inventory;
        });
    }

    public function releaseBooking($variantId, $quantity)
    {
        return DB::transaction(function () use ($variantId, $quantity) {
            $inventory = Inventory::where('variant_id', $variantId)->lockForUpdate()->firstOrFail();

            if ($inventory->reserved < $quantity) {
                $inventory->update(['reserved' => 0]);
            } else {
                $inventory->decrement('reserved', $quantity);
            }

            return $inventory;
        });
    }

    public function updateReturningStock($variantId, $quantity, $isIncreasing = true)
    {
        return DB::transaction(function () use ($variantId, $quantity, $isIncreasing) {
            $inventory = Inventory::where('variant_id', $variantId)->lockForUpdate()->firstOrFail();
            if ($isIncreasing) {
                $inventory->increment('returning', $quantity);
            } else {
                $inventory->decrement('returning', max(0, $quantity));
            }
            return $inventory;
        });
    }

    public function markAsUnavailable($variantId, $quantity)
    {
        return DB::transaction(function () use ($variantId, $quantity) {
            $inventory = Inventory::where('variant_id', $variantId)->lockForUpdate()->firstOrFail();

            if ($inventory->quantity < $quantity) {
                throw new \Exception("Không đủ hàng trong kho để chuyển vào mục Không thể bán.");
            }

            $inventory->decrement('quantity', $quantity);
            $inventory->increment('unavailable', $quantity);

            return $inventory;
        });
    }

    public function updatePackingStock($variantId, $quantity, $isStarting = true)
    {
        return DB::transaction(function () use ($variantId, $quantity, $isStarting) {
            $inventory = Inventory::where('variant_id', $variantId)->lockForUpdate()->firstOrFail();
            if ($isStarting) {
                $inventory->increment('packing', $quantity);
            } else {
                if ($inventory->packing < $quantity) {
                    $inventory->update(['packing' => 0]);
                } else {
                    $inventory->decrement('packing', $quantity);
                }
            }
            return $inventory;
        });
    }

    public function getMonthlyReport($month, $year)
    {
        $startDate = \Carbon\Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $allInventories = Inventory::with(['variant.product', 'variant.attributes'])->get();

        $transactionsInMonthRaw = DB::table('inventory_transactions')
            ->select('variant_id', 'type', DB::raw('SUM(quantity_change) as total'))
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('variant_id', 'type')
            ->get()
            ->groupBy('variant_id');

        $totalValue = 0;
        $totalImportCount = 0;
        $totalExportCount = 0;
        $totalAdjustCount = 0;
        $totalReturnCount = 0;
        $lowStockCount = 0;
        $outOfStockCount = 0;

        foreach ($allInventories as $inv) {
            if (!$inv->variant) continue;

            $changesAfter = DB::table('inventory_transactions')
                ->where('variant_id', $inv->variant_id)
                ->where('created_at', '>', $endDate)
                ->sum('quantity_change');

            $endStock = $inv->quantity - $changesAfter;
            $totalValue += $endStock * ($inv->variant->price ?? 0);

            if ($endStock <= 0) $outOfStockCount++;
            elseif ($endStock < $inv->min_quantity) $lowStockCount++;

            if (isset($transactionsInMonthRaw[$inv->variant_id])) {
                foreach ($transactionsInMonthRaw[$inv->variant_id] as $t) {
                    if ($t->type === 'in') $totalImportCount += $t->total;
                    elseif ($t->type === 'out') $totalExportCount += abs($t->total);
                    elseif ($t->type === 'adjustment') $totalAdjustCount += $t->total;
                    elseif ($t->type === 'return') $totalReturnCount += $t->total;
                }
            }
        }

        $paginatedInventories = Inventory::with(['variant.product', 'variant.attributes'])->paginate(10);

        $transactionsAfter = DB::table('inventory_transactions')
            ->select('variant_id', DB::raw('SUM(quantity_change) as total'))
            ->where('created_at', '>', $endDate)
            ->whereIn('variant_id', $paginatedInventories->pluck('variant_id'))
            ->groupBy('variant_id')
            ->get()
            ->keyBy('variant_id');

        $reportItems = [];

        foreach ($paginatedInventories as $inv) {
            $variantData = $inv->variant;

            $sku = $variantData->sku ?? 'N/A';
            $productName = $variantData->product->name ?? 'Sản phẩm không xác định';
            $attributes = ($variantData && $variantData->attributes) ? $variantData->attributes->pluck('attribute_value')->filter()->toArray() : [];
            $origin = ($variantData && $variantData->product) ? ($variantData->product->origin ?? '') : '';

            $detailsParts = $attributes;
            if ($origin) $detailsParts[] = $origin;
            $details = implode(' / ', $detailsParts);

            $id = $variantData->id ?? 0;
            $changesAfterMonth = ($id && isset($transactionsAfter[$id])) ? $transactionsAfter[$id]->total : 0;
            $endStock = $inv->quantity - $changesAfterMonth;

            $importQty = 0;
            $exportQty = 0;
            $adjustQty = 0;
            $returnQty = 0;

            if ($id && isset($transactionsInMonthRaw[$id])) {
                foreach ($transactionsInMonthRaw[$id] as $t) {
                    if ($t->type === 'in') $importQty += $t->total;
                    elseif ($t->type === 'out') $exportQty += abs($t->total);
                    elseif ($t->type === 'adjustment') $adjustQty += $t->total;
                    elseif ($t->type === 'return') $returnQty += $t->total;
                }
            }

            $changesInMonth = $importQty - $exportQty + $adjustQty + $returnQty;
            $calculatedStartStock = $endStock - $changesInMonth;

            $status = 'in_stock';
            if ($endStock <= 0) {
                $status = 'out_of_stock';
            } elseif ($endStock < $inv->min_quantity) {
                $status = 'low_stock';
            }

            $reportItems[] = [
                'sku'            => $sku,
                'productName'    => $productName,
                'variantDetails' => $details ?: '-',
                'startStock'     => $calculatedStartStock,
                'importQty'      => $importQty,
                'exportQty'      => $exportQty,
                'adjustQty'      => $adjustQty,
                'returnQty'      => $returnQty,
                'endStock'       => $endStock,
                'status'         => $status,
                'price'          => $variantData->price ?? 0,
            ];
        }

        return [
            'items' => $paginatedInventories->setCollection(collect($reportItems)),
            'summary' => [
                'totalVariants'   => $allInventories->count(),
                'totalValue'      => $totalValue,
                'lowStockCount'   => $lowStockCount,
                'outOfStockCount' => $outOfStockCount,
                'totalImport'     => $totalImportCount,
                'totalExport'     => $totalExportCount,
                'totalAdjust'     => $totalAdjustCount,
                'totalReturn'     => $totalReturnCount,
            ]
        ];
    }
}
