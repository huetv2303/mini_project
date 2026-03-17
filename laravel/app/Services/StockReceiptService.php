<?php

namespace App\Services;

use App\Interfaces\StockReceiptRepositoryInterface;
use App\Services\InventoryService; // Added this line
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StockReceiptService
{
    protected $stockReceiptRepository;
    protected $inventoryService; // Added this line

    public function __construct(
        StockReceiptRepositoryInterface $stockReceiptRepository,
        InventoryService $inventoryService // Added this line
    ) {
        $this->stockReceiptRepository = $stockReceiptRepository;
        $this->inventoryService = $inventoryService; // Added this line
    }

    public function getAll()
    {
        return $this->stockReceiptRepository->getAll();
    }

    public function getById($id)
    {
        return $this->stockReceiptRepository->getById($id);
    }

    public function create(array $data)
    {
        return DB::transaction(function () use ($data) {
            $items = $data['items'];
            $totalAmount = 0;

            foreach ($items as $item) {
                $totalAmount += $item['quantity'] * $item['unit_price'];
            }

            $createCode = 'PN-' . date('Ymd') . '-' . strtoupper(Str::random(6));

            $receiptData = [
                'code' => $createCode,
                'supplier_id' => $data['supplier_id'],
                'user_id' => auth()->id(),
                'status' => 'pending',
                'total_amount' => $totalAmount,
                'note' => $data['note'] ?? null,
                'received_at' => $data['received_at'] ?? null
            ];

            $receipt = $this->stockReceiptRepository->create($receiptData);


            foreach ($items as $item) {
                $receipt->items()->create([
                    'variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['quantity'] * $item['unit_price'] // Changed total_amount to total_price
                ]);
            }

            return $receipt->load('items');
        });
    }

    /**
     * Xác nhận nhập kho: Cập nhật status và thực hiện cộng tồn kho
     */
    public function confirm($id)
    {
        return DB::transaction(function () use ($id) {
            $receipt = $this->stockReceiptRepository->getById($id);

            if (!$receipt) {
                throw new \Exception("Không tìm thấy phiếu nhập kho.");
            }

            if ($receipt->status !== 'pending') {
                throw new \Exception("Chỉ có thể xác nhận phiếu nhập ở trạng thái chờ (pending).");
            }

            // Cộng tồn kho cho từng item
            foreach ($receipt->items as $item) {
                $this->inventoryService->increaseStock(
                    $item->variant_id,
                    $item->quantity,
                    'stock_receipt',
                    $receipt->id,
                    auth()->id(),
                    "Nhập kho theo phiếu: " . $receipt->code
                );
            }

            // Cập nhật trạng thái phiếu
            return $this->stockReceiptRepository->update([
                'status' => 'completed',
                'received_at' => now()
            ], $id);
        });
    }
}
