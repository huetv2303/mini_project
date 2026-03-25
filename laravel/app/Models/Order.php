<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'payment_method_id',
        'created_by',
        'status',
        'total_amount',
        'discount_amount',
        'shipping_fee',
        'final_amount',
        'payment_status',
        'note',
        'customer_name',
        'customer_phone',
        'customer_address',
        'shipping_method_id',
        'expected_delivery_date',
    ];

    protected $casts = [
        'expected_delivery_date' => 'date',
    ];

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function shippingMethod()
    {
        return $this->belongsTo(ShippingMethod::class);
    }

    public function staff()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function returns()
    {
        return $this->hasMany(OrderReturn::class);
    }
}
