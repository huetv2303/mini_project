<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Administrator',
                'code' => 'admin',
                'description' => 'Quản trị viên toàn quyền hệ thống'
            ],
            [
                'name' => 'Manager',
                'code' => 'manager',
                'description' => 'Quản lý cửa hàng, quản lý đơn hàng và sản phẩm'
            ],
            [
                'name' => 'Staff',
                'code' => 'staff',
                'description' => 'Nhân viên bán hàng, xử lý đơn hàng'
            ],
            [
                'name' => 'Customer',
                'code' => 'customer',
                'description' => 'Khách hàng mua sắm trên hệ thống'
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['code' => $role['code']], $role);
        }
    }
}
