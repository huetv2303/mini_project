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

    public function index()
    {
        $users = $this->userRepo->getAllUsers();
        return response()->json([
            'status' => 'success',
            'data'   => UserResource::collection($users)
        ]);
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
