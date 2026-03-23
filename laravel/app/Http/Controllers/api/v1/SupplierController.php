<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Supplier\StoreSupplierRequest;
use App\Http\Resources\SupplierResource;
use App\Services\SupplierService;
use App\Services\UploadService;
use Illuminate\Http\Request;
use Storage;

class SupplierController extends Controller
{
    protected $supplierService;
    protected $uploadService;

    public function __construct(SupplierService $supplierService, UploadService $uploadService)
    {
        $this->supplierService = $supplierService;
        $this->uploadService = $uploadService;
    }
    public function index(Request $request)
    {
        $query = $this->supplierService->getAll($request);

        if ($request->has('all') && $request->all == 'true') {
            $suppliers = $query->get();
            return response()->json([
                'status' => 'success',
                'message' => 'All supplier list',
                'data'   => SupplierResource::collection($suppliers)
            ]);
        }

        $suppliers = $query->paginate(10);
        return response()->json([
            'status' => 'success',
            'data'   => SupplierResource::collection($suppliers)->response()->getData(true)
        ]);
    }

    public function store(StoreSupplierRequest $request)
    {
        $validatedData = $request->validated();
        if ($request->hasFile('image')) {
            $image = $this->uploadService->uploadFile($request->file('image'), 'suppliers');
            $validatedData['image'] = $image['path'];
        }
        $supplier = $this->supplierService->createSupplier($validatedData);
        return response()->json([
            'status'  => 'success',
            'message' => 'Supplier created successfully',
            'data'    => new SupplierResource($supplier)
        ], 201);
    }

    public function show($slug)
    {
        $supplier = $this->supplierService->getBySlug($slug);
        if (!$supplier) {
            return response()->json(['status' => 'error', 'message' => 'Supplier not found'], 404);
        }
        return response()->json([
            'status' => 'success',
            'data'   => new SupplierResource($supplier)
        ]);
    }

    public function update(Request $request, $slug)
    {
        $supplier = $this->supplierService->getBySlug($slug);
        if (!$supplier) {
            return response()->json(['status' => 'error', 'message' => 'Supplier not found'], 404);
        }
        $validatedData = $request->all();
        if ($request->hasFile('image')) {
            if ($supplier->image) {
                $this->uploadService->deleteFile($supplier->image);
            }
            $image = $this->uploadService->uploadFile($request->file('image'), 'suppliers');
            $validatedData['image'] = $image['path'];
        }
        $updatedSupplier = $this->supplierService->updateSupplier($slug, $validatedData);
        return response()->json([
            'status'  => 'success',
            'message' => 'Supplier updated successfully',
            'data'    => new SupplierResource($updatedSupplier)
        ]);
    }

    public function destroy($slug)
    {
        $supplier = $this->supplierService->getBySlug($slug);
        if (!$supplier) {
            return response()->json(['status' => 'error', 'message' => 'Supplier not found'], 404);
        }
        if ($supplier->image) {
            $this->uploadService->deleteFile($supplier->image);
        }
        $this->supplierService->deleteSupplier($slug);
        return response()->json(null, 204);
    }
}
