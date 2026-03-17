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
        'total_price'
    ];

    public function stockReceipt()
    {
        return $this->belongsTo(StockReceipt::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function transactions()
    {
        return $this->hasMany(InventoryTransaction::class, 'reference_id')->where('reference_type', 'stock_receipt');
    }
}
