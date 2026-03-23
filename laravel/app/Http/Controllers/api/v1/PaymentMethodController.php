<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;

class PaymentMethodController extends Controller
{
    public function index()
    {
        $methods = PaymentMethod::where('is_active', true)->get();
        return response()->json([
            'status' => 'success',
            'data'   => $methods,
        ]);
    }
}
