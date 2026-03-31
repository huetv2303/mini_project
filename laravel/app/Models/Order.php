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
        'fulfillment_type',
        'shipping_address',
        'expected_delivery_date',
        'tax_rate_id',
        'tax_rate_snapshot',
        'tax_amount',
        'promotion_id',
        'promotion_code_snapshot',
        'customer_id',
    ];

    protected $casts = [
        'expected_delivery_date' => 'date',
    ];

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

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

    public function taxRate()
    {
        return $this->belongsTo(TaxRate::class);
    }

    public function promotion()
    {
        return $this->belongsTo(Promotion::class);
    }
}
