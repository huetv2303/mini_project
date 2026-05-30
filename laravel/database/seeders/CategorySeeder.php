<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // Tắt kiểm tra khóa ngoại để xóa sạch dữ liệu cũ
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Category::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $data = [
            [
                'name' => 'Áo Nam',
                'description' => 'Bộ sưu tập áo thời trang năng động và lịch lãm dành cho nam giới.',
                'is_featured' => true,
                'children' => [
                    ['name' => 'Áo Thun Nam', 'description' => 'Áo thun cotton co giãn, thoáng mát.'],
                    ['name' => 'Áo Sơ Mi Nam', 'description' => 'Áo sơ mi công sở thanh lịch.'],
                    ['name' => 'Áo Khoác Nam', 'description' => 'Áo khoác gió, áo khoác bomber ấm áp.'],
                ]
            ],
            [
                'name' => 'Quần Nam',
                'description' => 'Các loại quần jeans, kaki, short nam phom dáng cực chuẩn.',
                'is_featured' => true,
                'children' => [
                    ['name' => 'Quần Jeans Nam', 'description' => 'Quần bò denim cá tính, bền đẹp.'],
                    ['name' => 'Quần Kaki Nam', 'description' => 'Quần kaki công sở phom đứng lịch sự.'],
                    ['name' => 'Quần Short Nam', 'description' => 'Quần đùi đi chơi, thể thao thoải mái.'],
                ]
            ],
            [
                'name' => 'Váy & Đầm Nữ',
                'description' => 'Đầm dạ hội sang trọng và váy nhẹ nhàng quyến rũ cho phái đẹp.',
                'is_featured' => true,
                'children' => [
                    ['name' => 'Váy Công Sở', 'description' => 'Chuyên nghiệp, thanh lịch và cuốn hút.'],
                    ['name' => 'Đầm Dạ Hội', 'description' => 'Đầm lụa sang trọng cho các bữa tiệc.'],
                    ['name' => 'Chân Váy', 'description' => 'Chân váy chữ A, chân váy ôm xinh xắn.'],
                ]
            ],
            [
                'name' => 'Áo Nữ',
                'description' => 'Áo thun kiểu, áo sơ mi cách điệu thời thượng cho nữ giới.',
                'is_featured' => true,
                'children' => [
                    ['name' => 'Áo Thun Nữ', 'description' => 'Áo thun phông trơn và in hình cá tính.'],
                    ['name' => 'Áo Sơ Mi Nữ', 'description' => 'Áo sơ mi voan, sơ mi kiểu dáng điệu đà.'],
                    ['name' => 'Áo Croptop Nữ', 'description' => 'Croptop tôn dáng năng động trẻ trung.'],
                ]
            ],
            [
                'name' => 'Phụ Kiện Thời Trang',
                'description' => 'Nâng tầm phong cách thời trang của bạn với các phụ kiện tinh tế.',
                'is_featured' => false,
                'children' => [
                    ['name' => 'Thắt Lưng Da', 'description' => 'Thắt lưng da thật nam nữ sang trọng.'],
                    ['name' => 'Mũ Lưỡi Trai', 'description' => 'Nón lưỡi trai cá tính che nắng bụi.'],
                    ['name' => 'Tất & Vớ Cao Cấp', 'description' => 'Tất cotton kháng khuẩn, êm chân.'],
                ]
            ]
        ];

        foreach ($data as $item) {
            $parent = Category::create([
                'name' => $item['name'],
                'description' => $item['description'],
                'is_featured' => $item['is_featured'],
                'status' => 1
            ]);

            if (isset($item['children'])) {
                foreach ($item['children'] as $child) {
                    Category::create([
                        'name' => $child['name'],
                        'description' => $child['description'],
                        'parent_id' => $parent->id,
                        'status' => 1
                    ]);
                }
            }
        }
    }
}
