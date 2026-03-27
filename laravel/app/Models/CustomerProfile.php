<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerProfile extends Model
{
    protected $fillable = [
        'user_id',
        'phone',
        'gender',
        'date_of_birth',
        'address',
        'is_active',
        'loyalty_tier',
        'total_spent',
        'total_orders',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
