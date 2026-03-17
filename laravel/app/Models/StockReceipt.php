<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockReceipt extends Model
{
    protected $fillable = [
        'code',
        'supplier_id',
        'user_id',
        'status',
        'total_amount',
        'note',
        'received_at'
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(StockReceiptItem::class);
    }
}
