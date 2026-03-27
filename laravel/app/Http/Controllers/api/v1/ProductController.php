<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
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
            'data'   => ProductResource::collection($products)->response()->getData(true)
        ]);
    }

    public function show($slug)
    {
        try {
            $product = $this->productService->findBySlug($slug);
            if (!$product) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Product not found'
                ], 404);
            }
            $product->load(['category', 'supplier', 'images', 'attributes', 'variants.attributes', 'variants.inventories']);

            return response()->json([
                'status' => 'success',
                'data' => new ProductResource($product)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch product: ' . $e->getMessage()
            ], 500);
        }
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

    public function update(UpdateProductRequest $request, $slug)
    {
        $data = $request->validated();
        try {
            $product = $this->productService->updateProduct($data, $request, $slug);
            $product->load(['category', 'supplier', 'images', 'attributes', 'variants.attributes', 'variants.inventories']);

            return response()->json([
                'status' => 'success',
                'message' => 'Product updated successfully',
                'data' => new ProductResource($product)
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update product: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($slug)
    {
        try {
            $this->productService->destroy($slug);

            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete product: ' . $e->getMessage()
            ], 500);
        }
    }

    public function bulkDelete(Request $request)
    {
        try {
            $ids = $request->input('ids');
            if (empty($ids)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No IDs provided'
                ], 400);
            }

            $this->productService->bulkDestroy($ids);

            return response()->json([
                'status' => 'success',
                'message' => 'Products deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete products: ' . $e->getMessage()
            ], 500);
        }
    }

    public function search(Request $request)
    {
        $query = $request->query('q');
        if (!$query) {
            return response()->json([
                'status' => 'success',
                'data' => []
            ]);
        }

        $products = $this->productService->search($query);

        return response()->json([
            'status' => 'success',
            'data' => ProductResource::collection($products)
        ]);
    }

    public function getBySku($sku)
    {
        $product = $this->productService->getBySku($sku);
        if (!$product) {
            return response()->json([
                'status' => 'error',
                'message' => 'Product not found'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => new ProductResource($product)
        ]);
    }
}
