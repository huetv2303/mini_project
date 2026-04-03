<?php


namespace App\Interfaces\Order;

use App\Models\Order;

interface CheckoutRepositoryInterface
{
    public function checkout($request = null);
}
