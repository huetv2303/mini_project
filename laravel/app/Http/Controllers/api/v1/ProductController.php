<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Resources\ProductResource;
use App\Services\ProductService;

class ProductController extends Controller
{
    protected $productService;

    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }

    public function index(Request $request)
    {
        $products = $this->productService->getAll($request);
        return response()->json([
            'status' => 'success',
            'data' => ProductResource::collection($products)
        ]);
    }

    public function store(StoreProductRequest $request)
    {
        $data = $request->validated();
        
        try {
            $product = $this->productService->createProduct($data, $request);
            $product->load(['category', 'supplier', 'images', 'attributes', 'variants.attributes', 'variants.inventories']);

            return response()->json([
                'status' => 'success',
                'message' => 'Product created successfully',
                'data' => new ProductResource($product)
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create product: ' . $e->getMessage()
            ], 500);
        }
    }
}
