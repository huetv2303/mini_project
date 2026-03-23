<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderReturnItem extends Model
{
    protected $fillable = [
        'order_return_id',
        'order_item_id',
        'product_id',
        'product_variant_id',
        'quantity',
        'price',
        'subtotal',
    ];

    public function orderReturn()
    {
        return $this->belongsTo(OrderReturn::class);
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
