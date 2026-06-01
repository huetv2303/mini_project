<?php

namespace App\Interfaces;

interface PermissionRepositoryInterface
{
    /**
     * Lấy danh sách các permissions hiện có, gom nhóm theo group (module).
     * Với mỗi permission, chỉ lấy danh sách các user có quyền đó (chỉ gồm admin/staff).
     */
    public function getAllPermissionsToModule();

    /**
     * Đồng bộ hàng loạt danh sách user_ids cho các permission tương ứng.
     * Payload dạng: [['permission_id' => int, 'user_ids' => [int]]]
     */
    public function assignAdminsToPermissions(array $payload);
}
