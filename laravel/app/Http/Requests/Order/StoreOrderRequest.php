<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_name'             => 'required|string|max:255',
            'customer_phone'            => 'required|string|max:20',
            'customer_address'          => 'required|string',
            'payment_method_id'         => 'required|exists:payment_methods,id',
            'shipping_method_id'        => 'required|exists:shipping_methods,id',
            'discount_amount'           => 'nullable|numeric|min:0',
            'note'                      => 'nullable|string',
            'items'                     => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity'          => 'required|integer|min:1',
        ];
    }

    public function messages(): array
    {
        return [
            'items.required'                      => 'Phải có ít nhất 1 sản phẩm trong đơn hàng.',
            'items.*.product_variant_id.required' => 'Mỗi sản phẩm phải có ID biến thể hợp lệ.',
            'items.*.product_variant_id.exists'   => 'Biến thể sản phẩm không tồn tại.',
            'items.*.quantity.min'                => 'Số lượng phải ít nhất là 1.',
            'payment_method_id.exists'            => 'Phương thức thanh toán không hợp lệ.',
        ];
    }
}
