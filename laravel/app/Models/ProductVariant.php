<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVariant extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'product_id',
        'name',
        'sku',
        'price',
        'compare_price',
        'cost_price',
        'image',
        'weight',
        'height',
        'length',
        'width',
        'barcode',
        'status',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function attributes()
    {
        return $this->hasMany(ProductAttribute::class, 'variant_id');
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class, 'variant_id');
    }
    public function inventories(){
        return $this->hasMany(Inventory::class, 'variant_id');
    }
}
