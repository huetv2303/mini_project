<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockReceipt extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'supplier_id',
        'user_id',
        'status',
        'total_amount',
        'note',
        'received_at',
    ];

    protected $casts = [
        'received_at'  => 'datetime',
        'total_amount' => 'decimal:2',
    ];

    // ─── Relationships ───────────────────────────────────────────────────────

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function staff()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items()
    {
        return $this->hasMany(StockReceiptItem::class);
    }
}
