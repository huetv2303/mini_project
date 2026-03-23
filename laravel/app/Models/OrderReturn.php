<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrderReturn extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'order_id',
        'return_code',
        'total_return_amount',
        'reason',
        'receive_status',
        'refund_status',
        'status',
        'created_by',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function staff()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items()
    {
        return $this->hasMany(OrderReturnItem::class);
    }
}
