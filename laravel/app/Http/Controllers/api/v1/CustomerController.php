<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Services\CustomerService;
use App\Services\UploadService;
use Illuminate\Http\Request;

class CustomerController extends Controller
{

    protected $customerService;
    protected $uploadService;

    public function __construct(CustomerService $customerService, UploadService $uploadService)
    {
        $this->customerService = $customerService;
        $this->uploadService = $uploadService;
    }

    public function index()
    {
        $customers = $this->customerService->getAll();
        return response()->json([
            'status' => 'success',
            'data'   => CustomerResource::collection($customers)
        ]);
    }

    public function store(StoreCustomerRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('avatar')) {
            $upload = $this->uploadService->uploadFile($request->file('avatar'), 'customers/avatars');
            $data['avatar'] = $upload['path'];
        }

        $data['user_id'] = auth()->id() ?? 1;

        $customer = $this->customerService->createCustomer($data);

        return response()->json([
            'status' => 'success',
            'message' => 'Customer created successfully',
            'data'   => new CustomerResource($customer)
        ], 201);
    }

    public function show($id)
    {
        $customer = $this->customerService->getCustomerById($id);
        if (!$customer) {
            return response()->json(['status' => 'error', 'message' => 'Customer not found'], 404);
        }
        return response()->json([
            'status' => 'success',
            'data'   => new CustomerResource($customer)
        ]);
    }

    public function update(UpdateCustomerRequest $request, $id)
    {
        $customer = $this->customerService->getCustomerById($id);
        if (!$customer) {
            return response()->json(['status' => 'error', 'message' => 'Customer not found'], 404);
        }

        $data = $request->validated();

        if ($request->hasFile('avatar')) {
            // Xóa avatar cũ nếu có
            if ($customer->avatar) {
                $this->uploadService->deleteFile($customer->avatar);
            }
            $upload = $this->uploadService->uploadFile($request->file('avatar'), 'customers/avatars');
            $data['avatar'] = $upload['path'];
        }

        $updatedCustomer = $this->customerService->updateCustomer($id, $data);

        // Refresh model to get latest data
        $customer = $this->customerService->getCustomerById($id);

        return response()->json([
            'status' => 'success',
            'message' => 'Customer updated successfully',
            'data'   => new CustomerResource($customer)
        ]);
    }

    public function destroy($id)
    {
        $customer = $this->customerService->getCustomerById($id);
        if (!$customer) {
            return response()->json(['status' => 'error', 'message' => 'Customer not found'], 404);
        }

        if ($customer->avatar) {
            $this->uploadService->deleteFile($customer->avatar);
        }

        $this->customerService->destroyCustomer($id);

        return response()->json([
            'status' => 'success',
            'message' => 'Customer deleted successfully'
        ]);
    }
}
