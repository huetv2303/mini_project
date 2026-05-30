<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;
use Illuminate\Support\Facades\DB;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Tắt kiểm tra khóa ngoại để xóa sạch dữ liệu cũ
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Supplier::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $suppliers = [
            [
                'name' => 'Tổng Kho May Mặc Hà Nội',
                'contact_name' => 'Nguyễn Văn Hùng',
                'description' => 'Nhà cung cấp áo thun, áo khoác cotton cao cấp lớn nhất miền Bắc.',
                'address_detail' => 'Số 12, Đường Giải Phóng, Quận Hoàng Mai, Hà Nội',
                'phone' => '0912345678',
                'email' => 'contact@khomayhanoi.com',
                'tax_code' => '0102030405',
                'image' => 'suppliers/hanoi_garment.jpg',
                'status' => 1,
            ],
            [
                'name' => 'Công Ty CP Thời Trang VinaFashion',
                'contact_name' => 'Lê Thị Mai',
                'description' => 'Chuyên thiết kế và may gia công váy, đầm đầm công sở, dạ tiệc chuẩn xuất khẩu.',
                'address_detail' => '456 Lê Văn Sỹ, Phường 14, Quận 3, TP. Hồ Chí Minh',
                'phone' => '0987654321',
                'email' => 'sales@vinafashion.vn',
                'tax_code' => '0304050607',
                'image' => 'suppliers/vinafashion.jpg',
                'status' => 1,
            ],
            [
                'name' => 'Xưởng May Jeans Sài Gòn',
                'contact_name' => 'Trần Minh Tuấn',
                'description' => 'Chuyên sản xuất, cung cấp các sản phẩm jean, denim nam nữ chất lượng cao.',
                'address_detail' => '78/9 Nguyễn Ảnh Thủ, Hóc Môn, TP. Hồ Chí Minh',
                'phone' => '0909123456',
                'email' => 'jeanssaigon@gmail.com',
                'tax_code' => '0312345678',
                'image' => 'suppliers/jeans_saigon.jpg',
                'status' => 1,
            ],
            [
                'name' => 'Công Ty Dệt Kim & May Mặc H&M Việt Nam',
                'contact_name' => 'Hoàng Anh Đức',
                'description' => 'Đối tác cung ứng vải sợi và gia công đồ thể thao chuyên nghiệp.',
                'address_detail' => 'Khu Công Nghiệp Sóng Thần 1, Dĩ An, Bình Dương',
                'phone' => '02743888999',
                'email' => 'info@hmgarment.vn',
                'tax_code' => '3701234567',
                'image' => 'suppliers/hm_garment.jpg',
                'status' => 1,
            ],
            [
                'name' => 'Tổng Công Ty CP May Nhà Bè',
                'contact_name' => 'Phạm Thanh Sơn',
                'description' => 'Nhà sản xuất veston, quần tây, áo sơ mi nam cao cấp hàng đầu Việt Nam.',
                'address_detail' => 'Số 4 Bến Nghé, Tân Thuận Đông, Quận 7, TP. Hồ Chí Minh',
                'phone' => '02838720077',
                'email' => 'contact@nhabe.com.vn',
                'tax_code' => '0300398868',
                'image' => 'suppliers/nhabe.jpg',
                'status' => 1,
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::create($supplier);
        }
    }
}
