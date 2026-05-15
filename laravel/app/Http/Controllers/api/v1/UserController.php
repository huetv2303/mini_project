<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Interfaces\UserRepositoryInterface;
use Illuminate\Http\Request;

use App\Http\Resources\UserResource;

class UserController extends Controller
{
    protected $userRepo;

    public function __construct(UserRepositoryInterface $userRepo)
    {
        $this->userRepo = $userRepo;
    }

    public function index(Request $request)
    {
        $users = $this->userRepo->getAllUsers();
        
        // Có thể lọc theo role nếu cần
        if ($request->has('role_code')) {
            $users = $users->filter(function($user) use ($request) {
                return $user->role && $user->role->code === $request->role_code;
            });
        }

        return response()->json([
            'status' => 'success',
            'data'   => UserResource::collection($users)
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role_id'  => 'required|exists:roles,id'
        ]);

        try {
            $user = $this->userRepo->createUser($request->all());
            return response()->json([
                'status'  => 'success',
                'message' => 'Tạo người dùng thành công',
                'data'    => new UserResource($user->load('role'))
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Tạo thất bại: ' . $e->getMessage()
            ], 422);
        }
    }

    public function show($id)
    {
        try {
            $user = $this->userRepo->getUserById($id);
            return response()->json([
                'status' => 'success',
                'data'   => new UserResource($user)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Không tìm thấy người dùng'
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'email'    => 'sometimes|required|string|email|max:255|unique:users,email,' . $id,
            'password' => 'sometimes|nullable|string|min:8',
            'role_id'  => 'sometimes|required|exists:roles,id'
        ]);

        try {
            $user = $this->userRepo->updateUser($id, $request->all());
            return response()->json([
                'status'  => 'success',
                'message' => 'Cập nhật người dùng thành công',
                'data'    => new UserResource($user)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Cập nhật thất bại: ' . $e->getMessage()
            ], 422);
        }
    }

    public function destroy($id)
    {
        try {
            $this->userRepo->deleteUser($id);
            return response()->json([
                'status'  => 'success',
                'message' => 'Xóa người dùng thành công'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Xóa thất bại: ' . $e->getMessage()
            ], 422);
        }
    }

    public function updateRole(Request $request, $id)
    {
        $request->validate([
            'role_id' => 'required|exists:roles,id'
        ]);

        try {
            $user = $this->userRepo->updateRole($id, $request->role_id);
            return response()->json([
                'status'  => 'success',
                'message' => 'Cập nhật vai trò thành công cho người dùng ' . $user->name,
                'data'    => new UserResource($user)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Cập nhật thất bại: ' . $e->getMessage()
            ], 422);
        }
    }
}
