<?php

namespace App\Services;

use App\Interfaces\PermissionRepositoryInterface;

class PermissionService
{
    protected $permissionRepo;

    public function __construct(PermissionRepositoryInterface $permissionRepo)
    {
        $this->permissionRepo = $permissionRepo;
    }

    /**
     * Lấy ma trận quyền bán hàng gom nhóm theo module cho admin/staff
     */
    public function getAllPermissionsToModule()
    {
        return $this->permissionRepo->getAllPermissionsToModule();
    }

    /**
     * Thực hiện gán/đồng bộ quyền trực tiếp cho các Admin/Staff
     */
    public function assignAdminsToPermissions(array $payload)
    {
        return $this->permissionRepo->assignAdminsToPermissions($payload);
    }
}
