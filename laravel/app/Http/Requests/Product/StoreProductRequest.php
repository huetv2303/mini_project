<?php

namespace App\Http\Requests\Product;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Thông tin product chính
            'name'              => 'required|string|unique:products,name',
            'category_id'       => 'required|exists:categories,id',
            'supplier_id'       => 'required|exists:suppliers,id',
            'short_description' => 'nullable|string',
            'description'       => 'nullable|string',
            'status'            => 'in:active,inactive,draft',
            'feature_image'    => 'nullable|image|max:2048',
            // Gallery
            'images'            => 'nullable|array',
            'images.*.file'     => 'image|max:2048',
            'images.*.is_main'  => 'boolean',
            'images.*.sort_order' => 'integer',
            // Thuộc tính chung (không gắn variant)
            'attributes'                => 'nullable|array',
            'attributes.*.attribute_name'  => 'required|string',
            'attributes.*.attribute_value' => 'required|string',
            // Variants
            'variants'               => 'required|array|min:1',
            'variants.*.name'        => 'required|string',
            'variants.*.sku'         => 'required|unique:product_variants,sku',
            'variants.*.price'       => 'required|numeric|min:0',
            'variants.*.compare_price' => 'nullable|numeric',
            'variants.*.image'       => 'nullable|image|max:2048',
            'variants.*.attributes'  => 'nullable|array',
            'variants.*.attributes.*.attribute_name'  => 'required|string',
            'variants.*.attributes.*.attribute_value' => 'required|string',
            'variants.*.inventory.quantity' => 'required|integer|min:0',
        ];
    }
}
