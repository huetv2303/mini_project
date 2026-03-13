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

    public function __construct(SupplierService $supplierService, UploadService $uploadService){
        $this->supplierService = $supplierService;
        $this->uploadService = $uploadService;
    }
    public function index(Request $request){
        $suppliers = $this->supplierService->getAll($request);
         return response()->json([
            'data' => SupplierResource::collection($suppliers),
            'meta'  => [
                'current_page' => $suppliers->currentPage(),
                'last_page'    => $suppliers->lastPage(),
                'per_page'     => $suppliers->perPage(),
                'total'        => $suppliers->total(),
            ]
        ]);
    }
    public function store(StoreSupplierRequest $request){
        $validatedData = $request->validated();
        if ($request->hasFile('image')) {
            $image = $this->uploadService->uploadFile($request->file('image'), 'suppliers');
            $validatedData['image'] = $image['path'];
        }
        $supplier = $this->supplierService->createSupplier($validatedData);
        return response()->json([
            'status' => true,
            'message' => 'Supplier created successfully',
            'data' => $supplier
        ]);
    }

    public function show($slug){
        $supplier = $this->supplierService->getBySlug($slug);
        if (!$supplier) {
            return response()->json(['status' => 'error', 'message' => 'Supplier not found'], 404);
        }
        return response()->json([
            'status' => 'success',
            'data' => new SupplierResource($supplier)
        ]);
    }

    public function update(Request $request, $slug){
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
            'status' => true,
            'message' => 'Supplier updated successfully',
            'data' => $updatedSupplier
        ]);
    }

    public function destroy($slug){
        $supplier = $this->supplierService->getBySlug($slug);
        if (!$supplier) {
            return response()->json(['status' => 'error', 'message' => 'Supplier not found'], 404);
        }
        if ($supplier->image) {
            $this->uploadService->deleteFile($supplier->image);
        }
        $this->supplierService->deleteSupplier($slug);
        return response()->json([
            'status' => true,
            'message' => 'Supplier deleted successfully'
        ]);
    }
}
