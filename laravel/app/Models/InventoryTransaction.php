<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    public $timestamps = false;

    protected $fillable = [
        "variant_id",
        "type",
        "reference_type",
        "reference_id",
        "quantity_before",
        "quantity_change",
        "quantity_after",
        "note",
        "user_id",
        "created_at"
    ];

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reference()
    {
        return $this->morphTo();
    }
}
