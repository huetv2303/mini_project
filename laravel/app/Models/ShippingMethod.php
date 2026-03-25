<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingMethod extends Model
{
    protected $fillable = [
        'name',
        'cost',
        'estimated_days',
        'is_active',
    ];

    protected $casts = [
        'cost' => 'decimal:2',
        'estimated_days' => 'integer',
        'is_active' => 'boolean',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
