<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Supplier extends Model
{
    protected static function booted()
    {
        static::creating(function ($supplier) {
            $supplier->slug = Str::slug($supplier->name);
        });

        static::updating(function ($supplier) {
            $supplier->slug = Str::slug($supplier->name);
        });
    }

    protected $fillable = [
        'name',
        'slug',
        'image',
        'description',
        'contact_name',
        'email',
        'phone',
        'address_detail',
        'status',
        'tax_code'
    ];

    public function products()
    {
        return $this->hasMany(Product::class, 'supplier_id');
    }
}
