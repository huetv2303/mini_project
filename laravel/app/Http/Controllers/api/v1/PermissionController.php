<?php

namespace App\Http\Controllers\api\v1;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    /**
     * Danh sách tất cả các quyền (nhóm theo group)
     */
    public function index()
    {
        $permissions = Permission::all()->groupBy('group');
        
        return response()->json([
            'status' => 'success',
            'data'   => $permissions
        ]);
    }
}
