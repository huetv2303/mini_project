<?php

namespace App\Repositories;

use App\Interfaces\PermissionRepositoryInterface;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PermissionRepository implements PermissionRepositoryInterface
{
    /**
     * Lấy danh sách các permissions hiện có, gom nhóm theo group.
     * Với mỗi permission, chỉ lấy danh sách các user có quyền đó (chỉ gồm admin/staff).
     */
    public function getAllPermissionsToModule()
    {
        // Lấy tất cả permissions (ngoại trừ nhóm Hệ thống) cùng với users có role là admin hoặc staff (hoặc manager)
        $permissions = Permission::with(['users' => function ($query) {
            $query->whereHas('role', function ($q) {
                $q->whereIn('code', ['admin', 'staff', 'manager']);
            })->select('users.id', 'users.name', 'users.email', 'users.role_id');
        }])
        ->where('group', '!=', 'Hệ thống')
        ->get();

        return $permissions->groupBy('group');
    }

    /**
     * Đồng bộ hàng loạt danh sách user_ids cho các permission tương ứng.
     * Chỉ cho phép gán cho các user có role là admin hoặc staff (manager).
     * Payload dạng: [['permission_id' => int, 'user_ids' => [int]]]
     */
    public function assignAdminsToPermissions(array $payload)
    {
        return DB::transaction(function () use ($payload) {
            foreach ($payload as $item) {
                $permissionId = $item['permission_id'];
                $userIds = $item['user_ids'] ?? [];

                $permission = Permission::findOrFail($permissionId);

                // Bảo mật nghiêm ngặt: Lọc danh sách user_ids ở phía backend. 
                // Chỉ cho phép gán quyền cho các tài khoản có role là admin/staff/manager (Không được phép thao tác trên customer)
                $validUserIds = User::whereIn('id', $userIds)
                    ->whereHas('role', function ($q) {
                        $q->whereIn('code', ['admin', 'staff', 'manager']);
                    })
                    ->pluck('id')
                    ->toArray();

                // 1. Lấy tất cả user hiện tại đang được gán quyền trực tiếp này mà là admin/staff/manager
                $existingAdminStaffIds = $permission->users()
                    ->whereHas('role', function ($q) {
                        $q->whereIn('code', ['admin', 'staff', 'manager']);
                    })
                    ->pluck('users.id')
                    ->toArray();

                // 2. Detach toàn bộ các admin/staff cũ ra khỏi permission này
                if (!empty($existingAdminStaffIds)) {
                    $permission->users()->detach($existingAdminStaffIds);
                }

                // 3. Attach lại danh sách validUserIds mới với is_direct = 1
                if (!empty($validUserIds)) {
                    $attachData = [];
                    foreach ($validUserIds as $userId) {
                        $attachData[$userId] = ['is_direct' => 1];
                    }
                    $permission->users()->attach($attachData);
                }
            }
            return true;
        });
    }
}
