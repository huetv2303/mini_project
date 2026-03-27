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
            ['name' => 'Quản lý danh mục', 'code' => 'categories.manage', 'group' => 'Danh mục'],
            // Quản trị
            ['name' => 'Quản trị hệ thống', 'code' => 'admin.manage', 'group' => 'Hệ thống'],
        ];

        foreach ($permissions as $p) {
            Permission::updateOrCreate(['code' => $p['code']], $p);
        }

        // 2. Tạo các Role và gán Permission

        // Admin: Full quyền
        $adminRole = Role::updateOrCreate(
            ['code' => 'admin'],
            ['name' => 'Administrator', 'description' => 'Quản trị viên hệ thống']
        );
        $adminRole->permissions()->sync(Permission::all());


        $customerRole = Role::updateOrCreate(
            ['code' => 'customer'],
            ['name' => 'Customer', 'description' => 'Khách hàng']
        );
        $customerRole->permissions()->sync([]);

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
