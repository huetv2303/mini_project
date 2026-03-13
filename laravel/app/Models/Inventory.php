<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Inventory extends Model
{
    use SoftDeletes;
    protected $fillable =[
        'variant_id',
        'quantity',
        'reserved',
        'min_quantity',
    ];
    public function variant()
    {
        return $this->belongsTo(ProductVariant::class);
    }
}
