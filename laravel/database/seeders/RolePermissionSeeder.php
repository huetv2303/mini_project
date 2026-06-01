<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Tạo các Permission cơ bản
        $permissions = [
            // Sản phẩm
            ['name' => 'Xem sản phẩm', 'code' => 'products.view', 'group' => 'Sản phẩm'],
            ['name' => 'Tạo sản phẩm', 'code' => 'products.create', 'group' => 'Sản phẩm'],
            ['name' => 'Sửa sản phẩm', 'code' => 'products.edit', 'group' => 'Sản phẩm'],
            ['name' => 'Xóa sản phẩm', 'code' => 'products.delete', 'group' => 'Sản phẩm'],
            
            // Đơn hàng
            ['name' => 'Xem đơn hàng', 'code' => 'orders.view', 'group' => 'Đơn hàng'],
            ['name' => 'Sửa đơn hàng', 'code' => 'orders.edit', 'group' => 'Đơn hàng'],
            
            // Danh mục
            ['name' => 'Xem danh mục', 'code' => 'categories.view', 'group' => 'Danh mục'],
            ['name' => 'Quản lý danh mục', 'code' => 'categories.manage', 'group' => 'Danh mục'],

            // Nhà cung cấp
            ['name' => 'Xem nhà cung cấp', 'code' => 'suppliers.view', 'group' => 'Nhà cung cấp'],
            ['name' => 'Quản lý nhà cung cấp', 'code' => 'suppliers.manage', 'group' => 'Nhà cung cấp'],
            
            // Người dùng / Nhân viên
            ['name' => 'Xem người dùng', 'code' => 'users.view', 'group' => 'Người dùng'],
            ['name' => 'Quản lý người dùng', 'code' => 'users.manage', 'group' => 'Người dùng'],
            
            // Nhân viên (Staff Management)
            ['name' => 'Quản lý nhân viên', 'code' => 'staff.manage', 'group' => 'Nhân viên'],

            // Kho hàng
            ['name' => 'Quản lý kho', 'code' => 'inventory.manage', 'group' => 'Kho hàng'],
            
            // Đánh giá
            ['name' => 'Quản lý đánh giá', 'code' => 'reviews.manage', 'group' => 'Đánh giá'],

            // Tư vấn
            ['name' => 'Quản lý Tư vấn Chat', 'code' => 'support.manage', 'group' => 'Tư vấn'],

            // Quản trị
            ['name' => 'Truy cập trang quản trị', 'code' => 'dashboard.view', 'group' => 'Hệ thống'],
            ['name' => 'Quản trị hệ thống', 'code' => 'admin.manage', 'group' => 'Hệ thống'],
        ];

        foreach ($permissions as $p) {
            Permission::updateOrCreate(['code' => $p['code']], $p);
        }

        // 2. Tạo các Role và gán Permission

        // Admin: Full quyền
        $adminRole = Role::where('code', 'admin')->first();
        if ($adminRole) {
            $adminRole->permissions()->sync(Permission::all());
        }

        // Staff: Quyền hạn hạn chế theo yêu cầu
        $staffRole = Role::where('code', 'staff')->first();
        if ($staffRole) {
            $staffPermissions = Permission::whereIn('code', [
                'dashboard.view'     // Chỉ được vào dashboard, không thấy các module khác cho đến khi được gán
            ])->get();
            $staffRole->permissions()->sync($staffPermissions);
        }

        $customerRole = Role::where('code', 'customer')->first();
        if ($customerRole) {
            $customerRole->permissions()->sync([]);
        }

        // 3. Gán Role cho User test (nếu có)
        $adminUser = User::where('email', 'admin@example.com')->first();
        if ($adminUser) {
            $adminUser->update(['role_id' => $adminRole->id]);
        } else {
            User::create([
                'name' => 'Admin User',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
            ]);
        }
    }
}
