<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;

use App\Http\Resources\RoleResource;

class RoleController extends Controller
{

    public function index()
    {
        $roles = Role::with('permissions')->get();
        return response()->json([
            'status' => 'success',
            'data'   => RoleResource::collection($roles)
        ]);
    }

    /**
     * Chi tiết một vai trò
     */
    public function show($id)
    {
        $role = Role::with('permissions')->findOrFail($id);
        return response()->json([
            'status' => 'success',
            'data'   => new RoleResource($role)
        ]);
    }


    public function updatePermissions(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $request->validate([
            'permission_ids'   => 'required|array',
            'permission_ids.*' => 'exists:permissions,id'
        ]);

        $role->permissions()->sync($request->permission_ids);

        return response()->json([
            'status'  => 'success',
            'message' => 'Cập nhật quyền cho vai trò ' . $role->name . ' thành công.',
            'data'    => new RoleResource($role->load('permissions'))
        ]);
    }


    public function store(Request $request)
    {
        $data = $request->validate([
            'code'        => 'required|string|unique:roles,code',
            'name'        => 'required|string',
            'description' => 'nullable|string',
        ]);

        $role = Role::create($data);

        return response()->json([
            'status'  => 'success',
            'message' => 'Tạo vai trò thành công.',
            'data'    => new RoleResource($role)
        ], 201);
    }
}
