<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockReceiptItem extends Model
{
    protected $fillable = [
        'stock_receipt_id',
        'variant_id',
        'quantity',
        'unit_price',
        'total_price',
    ];

    protected $casts = [
        'unit_price'  => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    // ─── Relationships ───────────────────────────────────────────────────────

    public function receipt()
    {
        return $this->belongsTo(StockReceipt::class, 'stock_receipt_id');
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
}
