<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Interfaces\CustomerRepositoryInterface;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

use App\Services\UploadService;

class CustomerController extends Controller
{
    protected $customerRepo;
    protected $uploadService;

    public function __construct(CustomerRepositoryInterface $customerRepo, UploadService $uploadService)
    {
        $this->customerRepo = $customerRepo;
        $this->uploadService = $uploadService;
    }

    public function index(Request $request)
    {
        $query = $request->get('query');
        if ($query) {
            $customers = $this->customerRepo->searchCustomers($query);
        } else {
            $customers = $this->customerRepo->getAllCustomers();
        }
        return response()->json([
            'status' => 'success',
            'data' => UserResource::collection($customers)
        ]);
    }

    public function show($id)
    {
        $customer = $this->customerRepo->getCustomerById($id);
        return response()->json([
            'status' => 'success',
            'data' => new UserResource($customer)
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:6',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
        ]);

        $customer = $this->customerRepo->createCustomer($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Tạo khách hàng thành công',
            'data' => new UserResource($customer)
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'gender' => 'nullable|string',
            'date_of_birth' => 'nullable|date',
            'image' => 'nullable|image|max:2048', // Nhận file upload
        ]);

        if ($request->hasFile('image')) {
            $user = $this->customerRepo->getCustomerById($id);
            if ($user->avatar) {
                $this->uploadService->deleteFile($user->avatar);
            }
            $upload = $this->uploadService->uploadFile($request->file('image'), 'users');
            $validated['avatar'] = $upload['path'];
        }

        $customer = $this->customerRepo->updateCustomer($id, $validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật khách hàng thành công',
            'data' => new UserResource($customer)
        ]);
    }

    public function bulkUpdateStatus(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:users,id',
            'is_active' => 'required|boolean'
        ]);

        $this->customerRepo->bulkUpdateStatus($validated['ids'], $validated['is_active']);

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật trạng thái hàng loạt thành công'
        ]);
    }

    public function destroy($id)
    {
        $this->customerRepo->deleteCustomer($id);
        return response()->json([
            'status' => 'success',
            'message' => 'Xóa khách hàng thành công'
        ]);
    }
}
