<?php

namespace App\Services;

use App\Interfaces\InventoryRepositoryInterface;
use App\Interfaces\Product\ProductAttributeRepositoryInterface;
use App\Interfaces\Product\ProductImageRepositoryInterface;
use App\Interfaces\Product\ProductRepositoryInterface;
use App\Interfaces\Product\ProductVariantRepositoryInterface;
use \Illuminate\Support\Facades\DB;

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
            //  Tạo Product chính
            $product = $this->productRepo->createProduct($data);

            //  Upload Feature Image
            if ($request->hasFile('feature_image')) {
                $img =  $this->uploadImageService->uploadFile($request->file('feature_image'), 'products');
                $product->update(['feature_image' => $img['path']]);
            }

            // Tạo Product Images 
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

            //  Tạo Product Attributes 
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

            // Tạo Product Variants
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

                    // Variant Attributes
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

                    // Inventory cho Variant
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

    public function updateProduct(array $data, $request, $slug)
    {
        return DB::transaction(function () use ($data, $request, $slug) {
            $product = $this->productRepo->findBySlug($slug);
            if (!$product) {
                throw new \Exception("Product not found");
            }

            // 1. Cập nhật Product chính (lọc dữ liệu file và quan hệ)
            $productData = $data;
            unset($productData['attributes'], $productData['images'], $productData['variants'], $productData['feature_image']);
            $product->update($productData);

            // Xử lý Feature Image riêng biệt
            if ($request->hasFile('feature_image')) {
                // Xóa ảnh cũ nếu có
                if ($product->feature_image) {
                    $this->uploadImageService->deleteFile($product->feature_image);
                }
                $img = $this->uploadImageService->uploadFile($request->file('feature_image'), 'products');
                $product->update(['feature_image' => $img['path']]);
            }

            // 2. Đồng bộ Product Attributes chung (không gắn variant)
            $existingAttributeIds = $product->attributes()->whereNull('variant_id')->pluck('id')->map(fn($id) => (string)$id)->toArray();
            $newAttributeIds = [];

            if (isset($data['attributes']) && is_array($data['attributes'])) {
                foreach ($data['attributes'] as $attr) {
                    $attrId = isset($attr['id']) ? (string)$attr['id'] : null;
                    if ($attrId && in_array($attrId, $existingAttributeIds)) {
                        $this->productAttributeRepo->updateProAttribute($attr, $attrId);
                        $newAttributeIds[] = $attrId;
                    } else {
                        $newAttr = $this->productAttributeRepo->createProAttribute([
                            'product_id' => $product->id,
                            'variant_id' => null,
                            'attribute_name' => $attr['attribute_name'],
                            'attribute_value' => $attr['attribute_value'],
                        ]);
                        $newAttributeIds[] = (string)$newAttr->id;
                    }
                }
            }
            // Xóa các thuộc tính không còn giữ lại
            $product->attributes()->whereNull('variant_id')->whereNotIn('id', $newAttributeIds)->delete();

            // 3. Đồng bộ Product Images (Gallery)
            // Lấy tất cả ảnh hiện có để xử lý xóa file sau này
            $existingImages = $product->images()->get();
            $existingImageIds = $existingImages->pluck('id')->map(fn($id) => (string)$id)->toArray();
            $newImageIds = [];

            if (isset($data['images']) && is_array($data['images'])) {
                foreach ($data['images'] as $index => $imgData) {
                    $imgId = isset($imgData['id']) ? (string)$imgData['id'] : null;

                    if ($imgId && in_array($imgId, $existingImageIds)) {
                        $imageRecord = $existingImages->firstWhere('id', $imgId);
                        $imgUpdateData = $imgData;
                        unset($imgUpdateData['file']); // Không để lọt object file vào model

                        // Nếu có file mới gửi lên cho ID này, upload đè file cũ
                        if ($request->hasFile("images.$index.file")) {
                            if ($imageRecord && $imageRecord->image_path) {
                                $this->uploadImageService->deleteFile($imageRecord->image_path);
                            }
                            $uploadedImg = $this->uploadImageService->uploadFile($request->file("images.$index.file"), 'products/gallery');
                            $imgUpdateData['image_path'] = $uploadedImg['path'];
                        }

                        $this->productImageRepo->updateProImage($imgUpdateData, $imgId);
                        $newImageIds[] = $imgId;
                    } else {
                        // Tạo mới ảnh
                        if ($request->hasFile("images.$index.file")) {
                            $uploadedImg = $this->uploadImageService->uploadFile($request->file("images.$index.file"), 'products/gallery');
                            $newImg = $this->productImageRepo->createProImage([
                                'product_id' => $product->id,
                                'variant_id' => null,
                                'image_path' => $uploadedImg['path'],
                                'is_main' => $imgData['is_main'] ?? false,
                                'sort_order' => $imgData['sort_order'] ?? 0,
                            ]);
                            $newImageIds[] = (string)$newImg->id;
                        }
                    }
                }
            }

            // Xóa file vật lý và bản ghi database cho các ảnh bị loại bỏ
            $imagesToDelete = $existingImages->whereNotIn('id', $newImageIds);
            foreach ($imagesToDelete as $imgToDelete) {
                if ($imgToDelete->image_path) {
                    $this->uploadImageService->deleteFile($imgToDelete->image_path);
                }
                $imgToDelete->delete();
            }


            // 4. Đồng bộ Product Variants
            $existingVariants = $product->variants()->get();
            $existingVariantIds = $existingVariants->pluck('id')->map(fn($id) => (string)$id)->toArray();
            $newVariantIds = [];

            if (isset($data['variants']) && is_array($data['variants'])) {
                foreach ($data['variants'] as $vIndex => $variantData) {
                    $vAttributes = $variantData['attributes'] ?? null;
                    $vInventory = $variantData['inventory'] ?? null;

                    // Lọc dữ liệu update của Variant
                    $variantUpdateData = $variantData;
                    unset($variantUpdateData['attributes'], $variantUpdateData['inventory'], $variantUpdateData['image']);
                    $variantUpdateData['product_id'] = $product->id;

                    $variant = null;
                    $vId = isset($variantData['id']) ? (string)$variantData['id'] : null;

                    // Xác định update hay create
                    if ($vId && in_array($vId, $existingVariantIds)) {
                        $variant = $this->productVariantRepo->updateProVariant($variantUpdateData, $vId);
                    } elseif (isset($variantData['sku'])) {
                        $existingBySku = $existingVariants->firstWhere('sku', $variantData['sku']);
                        if ($existingBySku) {
                            $variant = $this->productVariantRepo->updateProVariant($variantUpdateData, $existingBySku->id);
                        }
                    }

                    if (!$variant) {
                        $variant = $this->productVariantRepo->createProVariant($variantUpdateData);
                    }
                    $newVariantIds[] = (string)$variant->id;

                    // Xử lý Upload/Update ảnh Variant
                    if ($request->hasFile("variants.$vIndex.image")) {
                        if ($variant->image) {
                            $this->uploadImageService->deleteFile($variant->image);
                        }
                        $variantImg = $this->uploadImageService->uploadFile($request->file("variants.$vIndex.image"), 'products/variants');
                        $variant->update(['image' => $variantImg['path']]);
                    }

                    // Đồng bộ Variant Attributes
                    $extVAttrIds = $variant->attributes()->pluck('id')->map(fn($id) => (string)$id)->toArray();
                    $newVAttrIds = [];
                    if (is_array($vAttributes)) {
                        foreach ($vAttributes as $vAttr) {
                            $vAttrId = isset($vAttr['id']) ? (string)$vAttr['id'] : null;
                            if ($vAttrId && in_array($vAttrId, $extVAttrIds)) {
                                $this->productAttributeRepo->updateProAttribute($vAttr, $vAttrId);
                                $newVAttrIds[] = $vAttrId;
                            } else {
                                $newVa = $this->productAttributeRepo->createProAttribute([
                                    'product_id' => $product->id,
                                    'variant_id' => $variant->id,
                                    'attribute_name' => $vAttr['attribute_name'],
                                    'attribute_value' => $vAttr['attribute_value'],
                                ]);
                                $newVAttrIds[] = (string)$newVa->id;
                            }
                        }
                    }
                    // Xóa attributes không còn nằm trong Variant
                    $variant->attributes()->whereNotIn('id', $newVAttrIds)->delete();

                    // Đồng bộ Inventory cho Variant
                    if (is_array($vInventory)) {
                        $inventory = $variant->inventories()->first();
                        if ($inventory) {
                            $this->inventoryRepo->updateInventory([
                                'quantity' => $vInventory['quantity'] ?? 0,
                                'min_quantity' => $vInventory['min_quantity'] ?? 0,
                            ], $inventory->id);
                        } else {
                            $this->inventoryRepo->createInventory([
                                'variant_id' => $variant->id,
                                'quantity' => $vInventory['quantity'] ?? 0,
                                'min_quantity' => $vInventory['min_quantity'] ?? 0,
                            ]);
                        }
                    }
                }
            }

            // Xóa file vật lý và bản ghi database cho các Variants bị loại bỏ
            $variantsToDelete = $existingVariants->whereNotIn('id', $newVariantIds);
            foreach ($variantsToDelete as $varToDelete) {
                // Xóa ảnh của variant
                if ($varToDelete->image) {
                    $this->uploadImageService->deleteFile($varToDelete->image);
                }

                // Thuộc tính và Inventory liên kết với Variant nên được khóa ngoài (Cascade Delete) xử lý 
                // hoặc sử dụng soft deletes tuỳ cấu hình của bạn. 
                $varToDelete->delete();
            }

            return $product;
        });
    }

    public function destroy($slug)
    {
        return DB::transaction(function () use ($slug) {
            $product = $this->productRepo->deleteProduct($slug);
            if (!$product) {
                throw new \Exception("Product not found");
            }

            // Xóa ảnh feature
            if ($product->feature_image) {
                $this->uploadImageService->deleteFile($product->feature_image);
            }

            // Xóa ảnh gallery
            foreach ($product->images as $image) {
                if ($image->image_path) {
                    $this->uploadImageService->deleteFile($image->image_path);
                }
                $image->delete(); // hoặc dùng hard delete tuỳ ý
            }

            // Xóa biến thể, ảnh của biến thể, và các kho/thuộc tính liên quan
            foreach ($product->variants as $variant) {
                if ($variant->image) {
                    $this->uploadImageService->deleteFile($variant->image);
                }
                $variant->attributes()->delete();
                $variant->inventories()->delete();
                $variant->delete();
            }

            // Xóa attributes chung của sản phẩm
            $product->attributes()->whereNull('variant_id')->delete();

            // Cuối cùng xóa Product chính
            $this->productRepo->deleteProduct($slug);

            return true;
        });
    }
}
