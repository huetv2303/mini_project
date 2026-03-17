<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'user_id',
        'code',
        'avatar',
        'name',
        'phone',
        'email',
        'password',
        'gender',
        'date_of_birth',
        'address',
        'is_active',
        'total_spent',
        'total_orders',
    ];
}
