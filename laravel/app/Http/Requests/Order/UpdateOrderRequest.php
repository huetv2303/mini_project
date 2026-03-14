<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status'         => 'sometimes|in:pending,processing,shipped,delivered,cancelled',
            'payment_status' => 'sometimes|in:unpaid,paid',
            'note'           => 'sometimes|nullable|string',
            'customer_name'  => 'sometimes|string|max:255',
            'customer_phone' => 'sometimes|string|max:20',
            'customer_address' => 'sometimes|string',
        ];
    }
}
