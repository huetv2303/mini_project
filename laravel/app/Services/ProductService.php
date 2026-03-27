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

    public function findBySlug($slug)
    {
        return $this->productRepo->findBySlug($slug);
    }
    public function createProduct(array $data, $request)
    {
        return DB::transaction(function () use ($data, $request) {
            //  Tạo Product chính
            $product = $this->productRepo->createProduct($data);

            //  Upload Feature Image
            if ($request->hasFile('feature_image')) {
                $img =  $this->uploadImageService->uploadFile($request->file('feature_image'), 'products', 800, 800);
                $product->update(['feature_image' => $img['path']]);
            }

            // Tạo Product Images 
            if (isset($data['images']) && is_array($data['images'])) {
                foreach ($data['images'] as $index => $imgData) {
                    if ($request->hasFile("images.$index.file")) {
                        $uploadedImg = $this->uploadImageService->uploadFile($request->file("images.$index.file"), 'products/gallery', 800, 800);
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

                    $vAttributes = $variantData['attributes'] ?? null;
                    $vInventory = $variantData['inventory'] ?? null;

                    unset($variantData['image'], $variantData['attributes'], $variantData['inventory']);

                    $variant = $this->productVariantRepo->createProVariant($variantData);

                    if ($request->hasFile("variants.$vIndex.image")) {
                        $variantImg = $this->uploadImageService->uploadFile($request->file("variants.$vIndex.image"), 'products/variants', 400, 400);
                        $variant->update(['image' => $variantImg['path']]);
                    }

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

            $productData = $data;
            unset($productData['attributes'], $productData['images'], $productData['variants'], $productData['feature_image']);
            $product->update($productData);

            if ($request->hasFile('feature_image')) {
                if ($product->feature_image) {
                    $this->uploadImageService->deleteFile($product->feature_image);
                }
                $img = $this->uploadImageService->uploadFile($request->file('feature_image'), 'products', 800, 800);
                $product->update(['feature_image' => $img['path']]);
            }

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
            $product->attributes()->whereNull('variant_id')->whereNotIn('id', $newAttributeIds)->delete();

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

                        if ($request->hasFile("images.$index.file")) {
                            if ($imageRecord && $imageRecord->image_path) {
                                $this->uploadImageService->deleteFile($imageRecord->image_path);
                            }
                            $uploadedImg = $this->uploadImageService->uploadFile($request->file("images.$index.file"), 'products/gallery', 800, 800);
                            $imgUpdateData['image_path'] = $uploadedImg['path'];
                        }

                        $this->productImageRepo->updateProImage($imgUpdateData, $imgId);
                        $newImageIds[] = $imgId;
                    } else {
                        if ($request->hasFile("images.$index.file")) {
                            $uploadedImg = $this->uploadImageService->uploadFile($request->file("images.$index.file"), 'products/gallery', 800, 800);
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

            $imagesToDelete = $existingImages->whereNotIn('id', $newImageIds);
            foreach ($imagesToDelete as $imgToDelete) {
                if ($imgToDelete->image_path) {
                    $this->uploadImageService->deleteFile($imgToDelete->image_path);
                }
                $imgToDelete->delete();
            }


            $existingVariants = $product->variants()->get();
            $existingVariantIds = $existingVariants->pluck('id')->map(fn($id) => (string)$id)->toArray();
            $newVariantIds = [];

            if (isset($data['variants']) && is_array($data['variants'])) {
                foreach ($data['variants'] as $vIndex => $variantData) {
                    $vAttributes = $variantData['attributes'] ?? null;
                    $vInventory = $variantData['inventory'] ?? null;

                    $variantUpdateData = $variantData;
                    unset($variantUpdateData['attributes'], $variantUpdateData['inventory'], $variantUpdateData['image']);
                    $variantUpdateData['product_id'] = $product->id;

                    $variant = null;
                    $vId = isset($variantData['id']) ? (string)$variantData['id'] : null;

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

                    if ($request->hasFile("variants.$vIndex.image")) {
                        if ($variant->image) {
                            $this->uploadImageService->deleteFile($variant->image);
                        }
                        $variantImg = $this->uploadImageService->uploadFile($request->file("variants.$vIndex.image"), 'products/variants', 400, 400);
                        $variant->update(['image' => $variantImg['path']]);
                    }

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
                    $variant->attributes()->whereNotIn('id', $newVAttrIds)->delete();

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

            $variantsToDelete = $existingVariants->whereNotIn('id', $newVariantIds);
            foreach ($variantsToDelete as $varToDelete) {
                if ($varToDelete->image) {
                    $this->uploadImageService->deleteFile($varToDelete->image);
                }
                $varToDelete->delete();
            }

            return $product;
        });
    }

    public function destroy($slug)
    {
        return DB::transaction(function () use ($slug) {
            $product = $this->productRepo->findBySlug($slug);
            if (!$product) {
                throw new \Exception("Product not found");
            }
            return $this->deleteProductData($product);
        });
    }

    public function bulkDestroy(array $ids)
    {
        return DB::transaction(function () use ($ids) {
            $products = $this->productRepo->findByIds($ids);
            foreach ($products as $product) {
                $this->deleteProductData($product);
            }
            return true;
        });
    }

    protected function deleteProductData($product)
    {
        if ($product->feature_image) {
            $this->uploadImageService->deleteFile($product->feature_image);
        }

        foreach ($product->images as $image) {
            if ($image->image_path) {
                $this->uploadImageService->deleteFile($image->image_path);
            }
            $image->delete();
        }

        foreach ($product->variants as $variant) {
            if ($variant->image) {
                $this->uploadImageService->deleteFile($variant->image);
            }
            $variant->attributes()->delete();
            $variant->inventories()->delete();
            $variant->delete();
        }

        $product->attributes()->whereNull('variant_id')->delete();
        $product->delete();

        return true;
    }

    public function search($query)
    {
        return $this->productRepo->search($query);
    }

    public function getBySku($sku)
    {
        return $this->productRepo->getBySku($sku);
    }
}
