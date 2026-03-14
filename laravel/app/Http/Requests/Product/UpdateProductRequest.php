<?php

namespace App\Http\Requests\Product;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use \Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
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
        $productId = $this->route('slug') ? \App\Models\Product::where('slug', $this->route('slug'))->value('id') : null;

        $rules = [
            // Thông tin product chính
            'name'              => 'required|string|unique:products,name' . ($productId ? ',' . $productId : ''),
            'category_id'       => 'required|exists:categories,id',
            'supplier_id'       => 'required|exists:suppliers,id',
            'short_description' => 'nullable|string',
            'description'       => 'nullable|string',
            'status'            => 'in:active,inactive,draft',
            'feature_image'     => 'nullable|image|max:2048',
            // Gallery
            'images'               => 'nullable|array',
            'images.*.id'          => 'nullable|exists:product_images,id',
            'images.*.file'        => 'nullable|image|max:2048',
            'images.*.is_main'     => 'boolean',
            'images.*.sort_order'  => 'integer',
            // Thuộc tính chung (không gắn variant)
            'attributes'                   => 'nullable|array',
            'attributes.*.id'              => 'nullable|exists:product_attributes,id',
            'attributes.*.attribute_name'  => 'required|string',
            'attributes.*.attribute_value' => 'required|string',
            // Variants
            'variants'               => 'required|array|min:1',
            'variants.*.id'          => [
                'nullable',
                Rule::exists('product_variants', 'id')->where(function ($query) use ($productId) {
                    return $query->where('product_id', $productId);
                })
            ],
            'variants.*.name'        => 'required|string',
            'variants.*.price'       => 'required|numeric|min:0',
            'variants.*.compare_price' => 'nullable|numeric',
            'variants.*.image'       => 'nullable|image|max:2048',
            'variants.*.attributes'  => 'nullable|array',
            'variants.*.attributes.*.id'              => 'nullable|exists:product_attributes,id',
            'variants.*.attributes.*.attribute_name'  => 'required|string',
            'variants.*.attributes.*.attribute_value' => 'required|string',
            'variants.*.inventory.quantity' => 'required|integer|min:0',
        ];

        if ($this->has('variants') && is_array($this->input('variants'))) {
            foreach ($this->input('variants') as $key => $variant) {
                if (isset($variant['id']) && $variant['id']) {
                    $rules["variants.$key.sku"] = [
                        'required',
                        'string',
                        Rule::unique('product_variants', 'sku')->ignore($variant['id']),
                    ];
                } else {
                    $rules["variants.$key.sku"] = 'required|string|unique:product_variants,sku';
                }
            }
        } else {
            $rules['variants.*.sku'] = 'required|string|unique:product_variants,sku';
        }

        return $rules;
    }
}
