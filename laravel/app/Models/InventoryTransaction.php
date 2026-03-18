<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    public $timestamps = false; // Chỉ dùng created_at, không có updated_at

    protected $fillable = [
        'variant_id',
        'type',
        'reference_type',
        'reference_id',
        'quantity_before',
        'quantity_change',
        'quantity_after',
        'note',
        'user_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];


    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
