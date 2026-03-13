<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;
class Category extends Model
{
     use HasFactory;
    protected static function booted(){
        static::creating(function ($category) {
            $category->slug = Str::slug($category->name);
        });

        static::updating(function ($category) {
            $category->slug = Str::slug($category->name);
        });

        static::creating(function ($category) {
            if ($category->parent_id) {
                $parent = Category::find($category->parent_id);
                $category->level = $parent ? $parent->level + 1 : 0;
            } else {
                $category->level = 0;
            }
        });

        static::updating(function ($category) {
            if ($category->parent_id) {
                $parent = Category::find($category->parent_id);
                $category->level = $parent ? $parent->level + 1 : 0;
            } else {
                $category->level = 0;
            }
        });
    }

    public function getRouteKeyName(){
        return 'slug';
    }
    protected $fillable = [
        'name',
        'slug',
        'image',
        'description',
        'parent_id',
        'status',
        'shop_id',
        'user_id',
        'level',
        'sort_order',
        'is_featured',
    ];


    public function parent(){
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function products(){
        return $this->hasMany(Product::class, 'category_id');
    }

}
