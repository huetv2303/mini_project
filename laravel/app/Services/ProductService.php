<?php

namespace App\Services;

use App\Interfaces\InventoryRepositoryInterface;
use App\Interfaces\Product\ProductAttributeRepositoryInterface;
use App\Interfaces\Product\ProductImageRepositoryInterface;
use App\Interfaces\Product\ProductRepositoryInterface;
use App\Interfaces\Product\ProductVariantRepositoryInterface;
use DB;

class ProductService
{
    protected $uploadImageService, $productRepo, $productAttributeRepo, $inventoryRepo, $productVariantRepo, $productImageRepo;

    public function __construct(
        ProductRepositoryInterface $productRepo,
        ProductAttributeRepositoryInterface $productAttributeRepo,
        InventoryRepositoryInterface $inventoryRepo,
        ProductVariantRepositoryInterface $productVariantRepo,
        ProductImageRepositoryInterface $productImageRepo,
        UploadService $uploadImageService
    ) {
        $this->productRepo = $productRepo;
        $this->productAttributeRepo = $productAttributeRepo;
        $this->inventoryRepo = $inventoryRepo;
        $this->productVariantRepo = $productVariantRepo;
        $this->productImageRepo = $productImageRepo;
        $this->uploadImageService = $uploadImageService;
    }

    public function getAll($request = null)
    {
        return $this->productRepo->getAll($request);
    }
    // public function getBySlug($slug)
    // {
    //     return $this->productRepo->getBySlug($slug);
    // }
    public function createProduct(array $data, $request)
    {
        return DB::transaction(function () use ($data, $request) {
            // 1. Tạo Product chính
            $product = $this->productRepo->createProduct($data);

            // 2. Upload Feature Image
            if ($request->hasFile('feature_image')) {
                $img =  $this->uploadImageService->uploadFile($request->file('feature_image'), 'products');
                $product->update(['feature_image' => $img['path']]);
            }

            // 3. Tạo Product Images (Gallery)
            if (isset($data['images']) && is_array($data['images'])) {
                foreach ($data['images'] as $index => $imgData) {
                    if ($request->hasFile("images.$index.file")) {
                        $uploadedImg = $this->uploadImageService->uploadFile($request->file("images.$index.file"), 'products/gallery');
                        $this->productImageRepo->createProImage([
                            'product_id' => $product->id,
                            'variant_id' => null,
                            'image_path' => $uploadedImg['path'],
                            'is_main' => $imgData['is_main'] ?? false,
                            'sort_order' => $imgData['sort_order'] ?? 0,
                        ]);
                    }
                }
            }

            // 4. Tạo Product Attributes (Chung)
            if (isset($data['attributes']) && is_array($data['attributes'])) {
                foreach ($data['attributes'] as $attr) {
                    $this->productAttributeRepo->createProAttribute([
                        'product_id' => $product->id,
                        'variant_id' => null,
                        'attribute_name' => $attr['attribute_name'],
                        'attribute_value' => $attr['attribute_value'],
                    ]);
                }
            }

            // 5. Tạo Product Variants
            if (isset($data['variants']) && is_array($data['variants'])) {
                foreach ($data['variants'] as $vIndex => $variantData) {
                    $variantData['product_id'] = $product->id;

                    // Lưu các field liên quan trước khi unset
                    $vAttributes = $variantData['attributes'] ?? null;
                    $vInventory = $variantData['inventory'] ?? null;

                    // Loại bỏ các field không phải column trong product_variants
                    unset($variantData['image'], $variantData['attributes'], $variantData['inventory']);

                    $variant = $this->productVariantRepo->createProVariant($variantData);

                    // 5a. Upload Variant Image (sau khi đã tạo variant)
                    if ($request->hasFile("variants.$vIndex.image")) {
                        $variantImg = $this->uploadImageService->uploadFile($request->file("variants.$vIndex.image"), 'products/variants');
                        $variant->update(['image' => $variantImg['path']]);
                    }

                    // 5b. Variant Attributes
                    if (is_array($vAttributes)) {
                        foreach ($vAttributes as $vAttr) {
                            $this->productAttributeRepo->createProAttribute([
                                'product_id' => $product->id,
                                'variant_id' => $variant->id,
                                'attribute_name' => $vAttr['attribute_name'],
                                'attribute_value' => $vAttr['attribute_value'],
                            ]);
                        }
                    }

                    // 5c. Inventory cho Variant
                    if (is_array($vInventory)) {
                        $this->inventoryRepo->createInventory([
                            'variant_id' => $variant->id,
                            'quantity' => $vInventory['quantity'] ?? 0,
                            'min_quantity' => $vInventory['min_quantity'] ?? 0,
                        ]);
                    }
                }
            }

            return $product;
        });
    }
}
