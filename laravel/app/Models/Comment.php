<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    protected $fillable = [
        'user_id',
        'product_id',
        'order_id',
        'content',
        'rating',
        'admin_reply',
        'replied_at',
        'is_hidden',
    ];

    protected $casts = [
        'replied_at' => 'datetime',
        'is_hidden' => 'boolean',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
