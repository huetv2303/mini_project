<?php

namespace App\Services;

use App\Interfaces\StockReceipt\StockReceiptRepositoryInterface;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StockReceiptService
{
    protected $receiptRepo;

    public function __construct(StockReceiptRepositoryInterface $receiptRepo)
    {
        $this->receiptRepo = $receiptRepo;
    }

    public function getAll($request = null)
    {
        return $this->receiptRepo->getAll($request);
    }

    public function findById($id)
    {
        return $this->receiptRepo->findById($id);
    }

    /**
     * Tạo phiếu nhập kho (status: pending)
     * Chưa cộng tồn kho, chỉ ghi nhận thông tin.
     */
    public function createReceipt(array $data, $userId)
    {
        return DB::transaction(function () use ($data, $userId) {
            $items       = $data['items'];
            $totalAmount = 0;

            // Tính tổng tiền
            foreach ($items as $item) {
                $totalAmount += $item['quantity'] * $item['unit_price'];
            }

            $code = 'PN-' . date('Ymd') . '-' . strtoupper(Str::random(5));

            $receipt = $this->receiptRepo->create([
                'code'         => $code,
                'supplier_id'  => $data['supplier_id'],
                'created_by'   => $userId,
                'status'       => 'pending',
                'total_amount' => $totalAmount,
                'note'         => $data['note'] ?? null,
                'received_at'  => $data['received_at'] ?? null,
            ]);

            // Tạo các dòng chi tiết
            foreach ($items as $item) {
                $receipt->items()->create([
                    'variant_id'  => $item['variant_id'],
                    'quantity'    => $item['quantity'],
                    'unit_price'  => $item['unit_price'],
                    'total_price' => $item['quantity'] * $item['unit_price'],
                ]);
            }

            return $receipt->load(['supplier', 'staff', 'items.variant']);
        });
    }

    /**
     * Xác nhận phiếu nhập → Cộng tồn kho + Ghi InventoryTransaction
     */
    public function confirmReceipt($id, $userId)
    {
        return DB::transaction(function () use ($id, $userId) {
            $receipt = $this->receiptRepo->findById($id);

            if ($receipt->status !== 'pending') {
                throw new \Exception('Chỉ có thể xác nhận phiếu đang ở trạng thái pending.');
            }

            foreach ($receipt->items as $item) {
                $inventory = Inventory::where('variant_id', $item->variant_id)->first();

                if (!$inventory) {
                    throw new \Exception("Không tìm thấy tồn kho cho variant ID: {$item->variant_id}");
                }

                $before = $inventory->quantity;

                // Cộng tồn kho
                $inventory->increment('quantity', $item->quantity);

                // Ghi lịch sử biến động
                InventoryTransaction::create([
                    'variant_id'      => $item->variant_id,
                    'type'            => 'in',
                    'reference_type'  => 'stock_receipt',
                    'reference_id'    => $receipt->id,
                    'quantity_before' => $before,
                    'quantity_change' => +$item->quantity,
                    'quantity_after'  => $before + $item->quantity,
                    'note'            => "Nhập kho theo phiếu {$receipt->code}",
                    'created_by'      => $userId,
                ]);
            }

            $this->receiptRepo->update([
                'status'      => 'completed',
                'received_at' => $receipt->received_at ?? now(),
            ], $id);

            return $this->receiptRepo->findById($id);
        });
    }

    /**
     * Huỷ phiếu nhập (chỉ khi đang pending)
     */
    public function cancelReceipt($id)
    {
        return DB::transaction(function () use ($id) {
            $receipt = $this->receiptRepo->findById($id);

            if ($receipt->status !== 'pending') {
                throw new \Exception('Chỉ có thể huỷ phiếu đang ở trạng thái pending.');
            }

            $this->receiptRepo->update(['status' => 'cancelled'], $id);

            return $this->receiptRepo->findById($id);
        });
    }
}
