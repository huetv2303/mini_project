<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Services\PermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PermissionController extends Controller
{
    protected $permissionService;

    public function __construct(PermissionService $permissionService)
    {
        $this->permissionService = $permissionService;
    }

    /**
     * Lấy ma trận quyền bán hàng trả về cho Frontend
     * GET /api/v1/permissions/all
     */
    public function getAllPermissions()
    {
        try {
            $groupedPermissions = $this->permissionService->getAllPermissionsToModule();

            // Biến đổi cấu trúc trả về sạch sẽ cho FE dễ render ma trận (Matrix)
            $formattedData = [];
            foreach ($groupedPermissions as $groupName => $permissions) {
                $formattedData[] = [
                    'group_name' => $groupName,
                    'permissions' => $permissions->map(function ($permission) {
                        return [
                            'id' => $permission->id,
                            'name' => $permission->name,
                            'code' => $permission->code,
                            'assigned_users' => $permission->users->map(function ($user) {
                                return [
                                    'id' => $user->id,
                                    'name' => $user->name,
                                    'email' => $user->email,
                                    'role_code' => $user->role ? $user->role->code : null,
                                ];
                            }),
                        ];
                    }),
                ];
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Lấy danh sách ma trận quyền thành công.',
                'data' => $formattedData
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Đã xảy ra lỗi khi lấy ma trận quyền: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Đồng bộ/Gán quyền trực tiếp cho các Admin/Staff
     * POST /api/v1/permissions/assign-users
     */
    public function assignUsers(Request $request)
    {
        // Validate payload nhận vào
        $validator = Validator::make($request->all(), [
            'assignments' => 'required|array',
            'assignments.*.permission_id' => 'required|integer|exists:permissions,id',
            'assignments.*.user_ids' => 'present|array',
            'assignments.*.user_ids.*' => 'integer|exists:users,id',
        ], [
            'assignments.required' => 'Dữ liệu phân quyền (assignments) là bắt buộc.',
            'assignments.array' => 'Dữ liệu phân quyền phải là một mảng.',
            'assignments.*.permission_id.required' => 'Mã quyền (permission_id) là bắt buộc.',
            'assignments.*.permission_id.exists' => 'Quyền (permission_id) không tồn tại trong hệ thống.',
            'assignments.*.user_ids.present' => 'Danh sách người dùng (user_ids) phải có mặt.',
            'assignments.*.user_ids.array' => 'Danh sách người dùng (user_ids) phải là một mảng.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Dữ liệu gửi lên không hợp lệ.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $payload = $request->input('assignments');
            
            $this->permissionService->assignAdminsToPermissions($payload);

            return response()->json([
                'status' => 'success',
                'message' => 'Đồng bộ phân quyền cho Quản trị viên/Nhân viên thành công.'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Đã xảy ra lỗi trong quá trình phân quyền: ' . $e->getMessage()
            ], 500);
        }
    }
}
