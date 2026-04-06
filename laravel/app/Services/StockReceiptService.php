<?php

namespace App\Services;

use App\Interfaces\StockReceipt\StockReceiptRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StockReceiptService
{
    protected $receiptRepo;
    protected $inventoryService;

    public function __construct(
        StockReceiptRepositoryInterface $receiptRepo,
        InventoryService $inventoryService
    ) {
        $this->receiptRepo = $receiptRepo;
        $this->inventoryService = $inventoryService;
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

            foreach ($items as $item) {
                $totalAmount += $item['quantity'] * $item['unit_price'];
            }

            $code = 'PN-' . date('Ymd') . '-' . strtoupper(Str::random(5));

            $receipt = $this->receiptRepo->create([
                'code'         => $code,
                'supplier_id'  => $data['supplier_id'],
                'user_id'      => $userId,
                'status'       => 'pending',
                'total_amount' => $totalAmount,
                'note'         => $data['note'] ?? null,
                'received_at'  => $data['received_at'] ?? null,
            ]);

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

    public function confirmReceipt($id, $userId)
    {
        return DB::transaction(function () use ($id, $userId) {
            $receipt = $this->receiptRepo->findById($id);

            if ($receipt->status !== 'pending') {
                throw new \Exception('Chỉ có thể xác nhận phiếu đang ở trạng thái pending.');
            }

            foreach ($receipt->items as $item) {
                $this->inventoryService->increaseStock(
                    $item->variant_id,
                    $item->quantity,
                    'stock_receipt',
                    $receipt->id,
                    $userId,
                    "Nhập kho theo phiếu {$receipt->code}"
                );
            }

            $this->receiptRepo->update([
                'status'      => 'completed',
                'received_at' => $receipt->received_at ?? now(),
            ], $id);

            return $this->receiptRepo->findById($id);
        });
    }

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
