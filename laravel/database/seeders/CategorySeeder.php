<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // Tắt kiểm tra khóa ngoại để xóa sạch dữ liệu cũ
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Category::query()->truncate();
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $data = [
            [
                'name' => 'Điện tử & Công nghệ',
                'description' => 'Các thiết bị số và phụ kiện công nghệ cao.',
                'children' => [
                    ['name' => 'Điện thoại & Tablet', 'description' => 'Smartphone và máy tính bảng mới nhất.'],
                    ['name' => 'Laptop & PC', 'description' => 'Máy tính xách tay và máy tính để bàn.'],
                    ['name' => 'Phụ kiện số', 'description' => 'Cáp, sạc, tai nghe và nhiều hơn nữa.'],
                ]
            ],
            [
                'name' => 'Thời trang Nam',
                'description' => 'Quần áo và phụ kiện dành cho nam giới.',
                'children' => [
                    ['name' => 'Áo thun Nam', 'description' => 'Các mẫu áo thun năng động.'],
                    ['name' => 'Quần Jean Nam', 'description' => 'Quần jean thời thượng.'],
                    ['name' => 'Giày dép Nam', 'description' => 'Giày thể thao và giày công sở.'],
                ]
            ],
            [
                'name' => 'Thời trang Nữ',
                'description' => 'Bộ sưu tập dành riêng cho phái đẹp.',
                'children' => [
                    ['name' => 'Váy & Đầm', 'description' => 'Quy trình công phu, sang trọng.'],
                    ['name' => 'Túi xách Nữ', 'description' => 'Túi xách cao cấp.'],
                    ['name' => 'Mỹ phẩm', 'description' => 'Sản phẩm chăm sóc sắc đẹp.'],
                ]
            ],
            [
                'name' => 'Đồ gia dụng',
                'description' => 'Thiết bị cho ngôi nhà hiện đại.',
                'children' => [
                    ['name' => 'Bếp & Phòng ăn', 'description' => 'Nồi cơm, lò vi sóng...'],
                    ['name' => 'Máy giặt & Tủ lạnh', 'description' => 'Điện máy lớn.'],
                    ['name' => 'Dụng cụ sửa chữa', 'description' => 'Khoan, búa, bộ dụng cụ.'],
                ]
            ],
            [
                'name' => 'Sức khỏe & Sắc đẹp',
                'description' => 'Chăm sóc bản thân mỗi ngày.',
                'children' => [
                    ['name' => 'Thực phẩm chức năng', 'description' => 'Hỗ trợ sức khỏe.'],
                    ['name' => 'Dụng cụ Massage', 'description' => 'Thư giãn tại nhà.'],
                    ['name' => 'Nước hoa', 'description' => 'Mùi hương quyến rũ.'],
                ]
            ],
            [
                'name' => 'Văn phòng phẩm',
                'description' => 'Dụng cụ học tập và làm việc.',
                'children' => [
                    ['name' => 'Bút & Viết', 'description' => 'Đầy đủ các loại bút.'],
                    ['name' => 'Sổ tay & Giấy', 'description' => 'Ghi chép tiện lợi.'],
                    ['name' => 'Sách chuyên ngành', 'description' => 'Kiến thức bổ ích.'],
                ]
            ]
        ];

        foreach ($data as $item) {
            $parent = Category::create([
                'name' => $item['name'],
                'description' => $item['description'],
                'status' => 1
            ]);

            if (isset($item['children'])) {
                foreach ($item['children'] as $child) {
                    $sub = Category::create([
                        'name' => $child['name'],
                        'description' => $child['description'],
                        'parent_id' => $parent->id,
                        'status' => 1
                    ]);

                    // Tạo thêm 1 cấp con nữa cho đa dạng (cấp cháu)
                    Category::create([
                        'name' => $child['name'] . ' Cao cấp',
                        'description' => 'Phiên bản đặc biệt.',
                        'parent_id' => $sub->id,
                        'status' => 1
                    ]);
                }
            }
        }
    }
}
