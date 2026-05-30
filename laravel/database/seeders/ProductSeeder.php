<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductAttribute;
use App\Models\ProductImage;
use App\Models\Inventory;
use App\Models\Category;
use App\Models\Supplier;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Tắt kiểm tra khóa ngoại để xóa sạch dữ liệu cũ
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Product::truncate();
        ProductVariant::truncate();
        ProductAttribute::truncate();
        ProductImage::truncate();
        Inventory::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Lấy tất cả Category cấp con (level > 0) hoặc parent cấp 0 nếu không có con
        $categories = Category::all();
        $suppliers = Supplier::all();

        if ($categories->isEmpty() || $suppliers->isEmpty()) {
            $this->command->error('Vui lòng chạy CategorySeeder và SupplierSeeder trước!');
            return;
        }

        // Định nghĩa 20 sản phẩm thời trang cực đẹp
        $productTemplates = [
            // Áo Nam
            [
                'name' => 'Áo Thun Cotton Basic Nam Cổ Tròn',
                'category_name' => 'Áo Thun Nam',
                'short_description' => 'Áo thun 100% cotton co giãn 4 chiều, mềm mịn, thấm hút mồ hôi cực tốt.',
                'description' => 'Áo thun cotton trơn là món đồ không thể thiếu trong tủ đồ của phái mạnh. Thiết kế trơn đơn giản nhưng vô cùng sang trọng, dễ dàng phối hợp với quần jeans, quần kaki hoặc quần short. Đường may tinh xảo, chắc chắn, không bị chảy xệ hay phai màu sau nhiều lần giặt.',
                'sizes' => ['S', 'M', 'L', 'XL'],
                'colors' => ['Đen', 'Trắng', 'Xám'],
                'base_price' => 150000.00,
                'cost_price' => 65000.00,
            ],
            [
                'name' => 'Áo Sơ Mi Oxford Nam Dài Tay',
                'category_name' => 'Áo Sơ Mi Nam',
                'short_description' => 'Áo sơ mi chất liệu oxford dày dặn, phom dáng slimfit thanh lịch.',
                'description' => 'Áo sơ mi nam Oxford cao cấp với phom dáng chuẩn, tôn lên bờ vai và ngực săn chắc. Thích hợp cho cả đi làm công sở lẫn đi chơi dạo phố. Vải dệt oxford mềm mại, thoáng mát và ít nhăn, mang lại trải nghiệm dễ chịu suốt ngày dài.',
                'sizes' => ['M', 'L', 'XL'],
                'colors' => ['Xanh Nhạt', 'Trắng'],
                'base_price' => 320000.00,
                'cost_price' => 140000.00,
            ],
            [
                'name' => 'Áo Khoác Bomber Kaki 2 Lớp',
                'category_name' => 'Áo Khoác Nam',
                'short_description' => 'Áo khoác bomber kaki phong cách trẻ trung năng động.',
                'description' => 'Áo khoác bomber nam chất liệu kaki dày dặn cao cấp, lót dù bên trong ấm áp chống gió tốt. Thiết kế bo chun tay và gấu áo tạo sự năng động, trẻ trung. Khóa kéo kim loại trơn tru và bền bỉ.',
                'sizes' => ['M', 'L', 'XL'],
                'colors' => ['Đen', 'Xanh Rêu'],
                'base_price' => 450000.00,
                'cost_price' => 195000.00,
            ],
            [
                'name' => 'Áo Polo Nam Premium Cotton cá sấu',
                'category_name' => 'Áo Thun Nam',
                'short_description' => 'Áo thun polo nam cổ bẻ thêu logo tinh tế, phom dáng regular.',
                'description' => 'Áo polo chất liệu vải cá sấu cotton co giãn tốt, thấm hút cao. Cổ áo dệt cứng cáp không bị nhão, bo tay ôm nhẹ khoe bắp tay khỏe khoắn. Phong cách công sở năng động hoặc thể thao cực chất.',
                'sizes' => ['M', 'L', 'XL', 'XXL'],
                'colors' => ['Xanh Đen', 'Xám', 'Trắng'],
                'base_price' => 240000.00,
                'cost_price' => 110000.00,
            ],

            // Quần Nam
            [
                'name' => 'Quần Jeans Slimfit Nam Wash Rách Nhẹ',
                'category_name' => 'Quần Jeans Nam',
                'short_description' => 'Quần bò denim co giãn tốt, dáng ôm slimfit trẻ trung tôn dáng.',
                'description' => 'Quần jeans nam được may từ chất liệu denim cao cấp pha spandex giúp co giãn thoải mái khi di chuyển. Thiết kế wash màu xanh basic kết hợp các chi tiết mài rách nhẹ tạo vẻ ngoài phong trần bụi bặm cho các chàng trai năng động.',
                'sizes' => ['29', '30', '31', '32'],
                'colors' => ['Xanh Đậm', 'Xanh Nhạt'],
                'base_price' => 390000.00,
                'cost_price' => 170000.00,
            ],
            [
                'name' => 'Quần Kaki Công Sở Nam Phom Dáng Hàn Quốc',
                'category_name' => 'Quần Kaki Nam',
                'short_description' => 'Quần kaki dáng đứng, túi mổ lịch sự, vải không phai màu.',
                'description' => 'Quần kaki trơn cao cấp phom dáng côn nhẹ đứng dáng, thích hợp cho quý ông công sở. Chất vải cotton pha sợi tre mềm mịn, ít bám bụi, co giãn nhẹ và rất bền màu. Dễ dàng mix cùng áo sơ mi, polo lịch lãm.',
                'sizes' => ['29', '30', '31', '32', '33'],
                'colors' => ['Đen', 'Be', 'Xám Ghi'],
                'base_price' => 350000.00,
                'cost_price' => 150000.00,
            ],
            [
                'name' => 'Quần Short Kaki Nam Đi Chơi Siêu Nhẹ',
                'category_name' => 'Quần Short Nam',
                'short_description' => 'Quần đùi kaki dài ngang gối, năng động, thoải mái.',
                'description' => 'Quần short kaki nam phong cách basic trẻ trung, thích hợp cho mùa hè nóng nực hay những buổi dã ngoại ngoài trời. Chất kaki mềm, mát, giặt nhanh khô và cực bền đẹp.',
                'sizes' => ['M', 'L', 'XL'],
                'colors' => ['Xanh Đen', 'Be', 'Rêu'],
                'base_price' => 180000.00,
                'cost_price' => 75000.00,
            ],
            [
                'name' => 'Quần Tây Âu Nam Dáng Slimfit Lịch Lãm',
                'category_name' => 'Quần Kaki Nam',
                'short_description' => 'Quần tây nam chất tuyết mưa cao cấp, chống nhăn hiệu quả.',
                'description' => 'Quần tây nam phom dáng Hàn Quốc, ôm nhẹ phần hông đùi tạo sự gọn gàng thanh lịch. Chất vải tuyết mưa đứng dáng, co giãn tốt, không phai màu, không xù lông và cực kỳ phẳng phiu sau khi ủi.',
                'sizes' => ['29', '30', '31', '32'],
                'colors' => ['Đen', 'Xanh Than'],
                'base_price' => 380000.00,
                'cost_price' => 165000.00,
            ],

            // Váy & Đầm Nữ
            [
                'name' => 'Đầm Lụa Satin Dạ Hội Cổ V Sang Trọng',
                'category_name' => 'Đầm Dạ Hội',
                'short_description' => 'Đầm dạ hội lụa satin bóng nhẹ, chiết eo thướt tha quý phái.',
                'description' => 'Bộ váy đầm dự tiệc hoàn hảo dành cho phái đẹp. Được may từ chất lụa satin cao cấp rủ nhẹ tạo cảm giác thướt tha, thướt tha. Cổ chữ V gợi cảm khoe xương quai xanh quyến rũ kết hợp chiết eo cao tôn dáng tối đa.',
                'sizes' => ['S', 'M', 'L'],
                'colors' => ['Đỏ Rượu', 'Đen', 'Champagne'],
                'base_price' => 690000.00,
                'cost_price' => 300000.00,
            ],
            [
                'name' => 'Váy Hoa Voan Vintage Nữ Dáng Dài',
                'category_name' => 'Váy Công Sở',
                'short_description' => 'Váy voan hai lớp họa tiết hoa nhí nhẹ nhàng nữ tính.',
                'description' => 'Váy voan tơ dáng dài qua gối phong cách vintage dịu dàng. Họa tiết hoa nhí xinh xắn, thiết kế tay bồng nhẹ che khuyết điểm bắp tay. Váy có lót lụa mềm mại bên trong, không lo lộ nội y, thoáng mát vào mùa hè.',
                'sizes' => ['S', 'M', 'L'],
                'colors' => ['Vàng Nhạt', 'Xanh Mint'],
                'base_price' => 450000.00,
                'cost_price' => 180000.00,
            ],
            [
                'name' => 'Chân Váy Xếp Ly Ngắn Học Đường cá tính',
                'category_name' => 'Chân Váy',
                'short_description' => 'Chân váy tennis xếp ly ngắn kèm quần bảo hộ bên trong tiện lợi.',
                'description' => 'Chân váy xếp ly dáng xòe trẻ trung phong cách Hàn Quốc. Chất vải tuyết mưa đứng dáng, xếp ly to sắc sảo không bị mất nếp sau khi giặt. Thích hợp mix cùng áo thun, croptop hay áo sơ mi học sinh năng động.',
                'sizes' => ['S', 'M', 'L'],
                'colors' => ['Đen', 'Xám', 'Trắng'],
                'base_price' => 220000.00,
                'cost_price' => 90000.00,
            ],
            [
                'name' => 'Đầm Công Sở Dáng A Cổ Đức Phối Cúc',
                'category_name' => 'Váy Công Sở',
                'short_description' => 'Đầm chữ A cổ sơ mi thanh lịch, chất vải lanh xước dày dặn.',
                'description' => 'Lựa chọn hàng đầu cho chị em diện đến văn phòng mỗi ngày. Phom chữ A trẻ trung giúp che khuyết điểm vòng 2 và vòng 3. Cổ đức thanh lịch phối cúc gỗ mộc mạc tinh tế tạo điểm nhấn lịch sự nhưng không kém phần trẻ trung.',
                'sizes' => ['S', 'M', 'L', 'XL'],
                'colors' => ['Hồng Pastel', 'Xanh Pastel'],
                'base_price' => 390000.00,
                'cost_price' => 160000.00,
            ],

            // Áo Nữ
            [
                'name' => 'Áo Thun Nữ Phông Rộng Unisex Cotton',
                'category_name' => 'Áo Thun Nữ',
                'short_description' => 'Áo phông dáng rộng giấu quần trẻ trung cá tính.',
                'description' => 'Áo thun nữ phom rộng unisex in hình họa tiết dễ thương sắc nét. Chất cotton 100% mềm mịn dày dặn không bai nhão. Dễ phối đồ jeans hoặc mặc kiểu giấu quần cực kỳ năng động.',
                'sizes' => ['M', 'L'],
                'colors' => ['Trắng', 'Đen', 'Hồng'],
                'base_price' => 160000.00,
                'cost_price' => 70000.00,
            ],
            [
                'name' => 'Áo Sơ Mi Nữ Voan Cách Điệu Cổ Thắt Nơ',
                'category_name' => 'Áo Sơ Mi Nữ',
                'short_description' => 'Áo sơ mi voan lụa tay bồng, thắt nơ cổ duyên dáng.',
                'description' => 'Áo sơ mi voan cát cao cấp mỏng nhẹ mát mẻ mà cực kỳ sang chảnh. Điểm nhấn là chiếc nơ cổ dịu dàng phối tay bồng nhẹ bo chun cổ tay tiểu thư. Rất thích hợp diện đi làm hoặc hẹn hò.',
                'sizes' => ['S', 'M', 'L'],
                'colors' => ['Trắng', 'Kem'],
                'base_price' => 280000.00,
                'cost_price' => 120000.00,
            ],
            [
                'name' => 'Áo Croptop Thun Gân Nữ ôm Sát Tôn Dáng',
                'category_name' => 'Áo Croptop Nữ',
                'short_description' => 'Áo croptop cổ vuông tay ngắn cá tính gợi cảm.',
                'description' => 'Áo croptop ôm sát khoe trọn vòng eo thon gọn và tôn vòng 1 quyến rũ. Vải thun gân tăm co giãn đàn hồi cực tốt, thấm hút mồ hôi tốt. Rất dễ phối cùng quần baggy jeans, chân váy hay quần short.',
                'sizes' => ['S', 'M'],
                'colors' => ['Đen', 'Trắng', 'Xanh Dương'],
                'base_price' => 120000.00,
                'cost_price' => 50000.00,
            ],
            [
                'name' => 'Áo Hoodie Nữ Nỉ Ngoại Phom Rộng Ấm Áp',
                'category_name' => 'Áo Thun Nữ',
                'short_description' => 'Áo khoác hoodie nỉ bông dày dặn, có mũ, túi trước to.',
                'description' => 'Áo khoác nỉ hoodie phong cách thu đông cực kỳ cá tính. Vải nỉ ngoại dày dặn, lót bông êm ái giữ ấm cực tốt. Thiết kế nón trùm to ấm áp kèm dây rút điều chỉnh tiện lợi.',
                'sizes' => ['M', 'L', 'XL'],
                'colors' => ['Xám', 'Đen', 'Hồng Đậm'],
                'base_price' => 350000.00,
                'cost_price' => 150000.00,
            ],

            // Phụ Kiện
            [
                'name' => 'Thắt Lưng Da Bò Khóa Kim Loại Tự Động Nam',
                'category_name' => 'Thắt Lưng Da',
                'short_description' => 'Thắt lưng da bò nguyên tấm cao cấp, đầu khóa hợp kim không gỉ.',
                'description' => 'Phụ kiện đẳng cấp nâng tầm bộ suit của đấng mày râu. Dây thắt lưng làm từ da bò thật 100% mềm dẻo, bền chắc, đầu khóa trượt tự động sang trọng mạ chrome chống xước gỉ tuyệt đối.',
                'sizes' => ['Standard'],
                'colors' => ['Đen', 'Nâu'],
                'base_price' => 320000.00,
                'cost_price' => 140000.00,
            ],
            [
                'name' => 'Mũ Nón Lưỡi Trai Kaki Trơn Unisex Đội Đi Chơi',
                'category_name' => 'Mũ Lưỡi Trai',
                'short_description' => 'Nón lưỡi trai chất kaki 100% dày dặn đứng phom.',
                'description' => 'Mũ lưỡi trai phong cách basic tối giản dễ phối đồ. Chất liệu vải kaki thô dày dặn, khóa cài kim loại phía sau đầu dễ dàng tùy chỉnh kích cỡ đầu phù hợp cho cả nam và nữ.',
                'sizes' => ['Standard'],
                'colors' => ['Đen', 'Trắng', 'Xanh Navy'],
                'base_price' => 99000.00,
                'cost_price' => 35000.00,
            ],
            [
                'name' => 'Set 5 Đôi Tất Vớ Cổ Ngắn Cotton Kháng Khuẩn',
                'category_name' => 'Tất & Vớ Cao Cấp',
                'short_description' => 'Hộp 5 đôi vớ lười cotton siêu mềm co giãn khử mùi hôi chân.',
                'description' => 'Vớ cổ ngắn chất cotton đanh mịn co giãn êm ái ôm khít bàn chân. Công nghệ nano bạc kháng khuẩn khử mùi hôi hiệu quả thích hợp đi giày lười, giày thể thao vận động dã ngoại.',
                'sizes' => ['Free Size'],
                'colors' => ['Mixed Color'],
                'base_price' => 75000.00,
                'cost_price' => 25000.00,
            ],
            [
                'name' => 'Kính Mát Phi Công Thời Trang Chống UV400',
                'category_name' => 'Mũ Lưỡi Trai',
                'short_description' => 'Kính mát phi công gọng kim loại mạ vàng sang trọng.',
                'description' => 'Kính râm phi công bảo vệ mắt tối ưu khỏi tia cực tím UV400 khi đi nắng bụi. Mắt kính phân cực polarized chống chói lóa, gọng hợp kim cao cấp thanh mảnh ôm mặt cực kỳ sang chảnh quý phái.',
                'sizes' => ['Standard'],
                'colors' => ['Đen Gọng Vàng', 'Đen Gọng Bạc'],
                'base_price' => 290000.00,
                'cost_price' => 110000.00,
            ],
        ];

        // Lấy danh sách ảnh thật có sẵn trong public
        $variantImages = [
            'products/variants/69bcbf3dc1e2b.webp',
            'products/variants/7objUZPF1iSp9vbJn6GKGXupCY8pukCgANxN7xNC.jpg',
            'products/variants/OJJgZ6asq5Pt42Q8lMH54oDw51cxki3ECkCvLwRq.jpg',
            'products/variants/Qd6sNczQtu2dBF6UdDLBL0f8tlhfxaObMvC6W94o.jpg',
            'products/variants/q750gUsXHu1x88w8OmBrUgunC3RgJI19mVlIMt5w.jpg',
            'products/variants/v99FOVXfEF0raWLVXcFgVmMPIFPiqYKcNp4ZtnrZ.jpg',
        ];

        $mainImages = [
            'products/69bcbf3ce297f.webp',
            'products/wUFaE8VFYcCPfKjsvCkXLu7Gek1BygDc1UZQpEY0.jpg',
            'products/YvSWQNfOV76K84kOv9YTQVY413uxBdsnuA1GWmx6.jpg',
        ];

        $productCount = 1;

        foreach ($productTemplates as $tpl) {
            // Tìm category ID
            $cat = Category::where('name', $tpl['category_name'])->first();
            $catId = $cat ? $cat->id : $categories->random()->id;

            // Chọn ngẫu nhiên nhà cung cấp
            $supplier = $suppliers->random();

            // Chọn ngẫu nhiên ảnh chính
            $featureImg = $mainImages[array_rand($mainImages)];

            // Tạo sản phẩm chính
            $product = Product::create([
                'name' => $tpl['name'],
                'short_description' => $tpl['short_description'],
                'description' => $tpl['description'],
                'category_id' => $catId,
                'supplier_id' => $supplier->id,
                'feature_image' => $featureImg,
                'status' => 'active',
                'sold_count' => rand(15, 120),
                'is_taxable' => true,
            ]);

            // Tạo các thuộc tính chung (nếu có, ví dụ Chất liệu)
            ProductAttribute::create([
                'product_id' => $product->id,
                'variant_id' => null,
                'attribute_name' => 'Chất liệu',
                'attribute_value' => in_array($tpl['category_name'], ['Thắt Lưng Da']) ? 'Da bò thật 100%' : 'Premium Cotton',
            ]);

            // Sinh các biến thể (Variants) dựa trên Sizes và Colors
            $variantCount = 1;
            foreach ($tpl['sizes'] as $size) {
                foreach ($tpl['colors'] as $color) {
                    $variantName = "Size " . $size . " - Màu " . $color;
                    if (count($tpl['sizes']) == 1 && $size == 'Standard') {
                        $variantName = "Màu " . $color;
                    }
                    if (count($tpl['sizes']) == 1 && $size == 'Free Size') {
                        $variantName = "Hộp 5 đôi - Đa sắc";
                    }

                    // Tên mã SKU viết tắt
                    $skuPrefix = 'SP' . str_pad($productCount, 2, '0', STR_PAD_LEFT);
                    $sizeCode = Str::upper(Str::slug($size));
                    $colorCode = Str::upper(Str::slug($color));
                    $sku = "{$skuPrefix}-{$sizeCode}-{$colorCode}";

                    // Một vài biến thể có giá chênh lệch tí cho sinh động
                    $priceDiff = rand(0, 3) * 10000;
                    $price = $tpl['base_price'] + $priceDiff;
                    $comparePrice = $price + rand(40, 80) * 1000;
                    $costPrice = $tpl['cost_price'];

                    // Chọn ảnh biến thể
                    $vImg = $variantImages[array_rand($variantImages)];

                    $variant = ProductVariant::create([
                        'product_id' => $product->id,
                        'name' => $variantName,
                        'sku' => $sku,
                        'price' => $price,
                        'compare_price' => $comparePrice,
                        'cost_price' => $costPrice,
                        'image' => $vImg,
                        'weight' => rand(150, 400) / 1000.0, // kg
                        'height' => 3.00,
                        'width' => 15.00,
                        'length' => 20.00,
                        'barcode' => '893' . rand(100000000, 999999999),
                        'status' => 1,
                    ]);

                    // Gán thuộc tính riêng (Size và Color) cho biến thể này
                    if ($size !== 'Standard' && $size !== 'Free Size') {
                        ProductAttribute::create([
                            'product_id' => $product->id,
                            'variant_id' => $variant->id,
                            'attribute_name' => 'Size',
                            'attribute_value' => $size,
                        ]);
                    }

                    ProductAttribute::create([
                        'product_id' => $product->id,
                        'variant_id' => $variant->id,
                        'attribute_name' => 'Color',
                        'attribute_value' => $color,
                    ]);

                    // Tạo bản ghi lưu kho (Inventory)
                    Inventory::create([
                        'variant_id' => $variant->id,
                        'quantity' => rand(80, 250), // Tổng tồn kho từ 80 đến 250 cái
                        'reserved' => 0,
                        'unavailable' => 0,
                        'returning' => 0,
                        'packing' => 0,
                        'min_quantity' => 10, // Cảnh báo khi tồn kho dưới 10 cái
                    ]);

                    // Thêm ảnh biến thể vào bảng product_images
                    ProductImage::create([
                        'product_id' => $product->id,
                        'variant_id' => $variant->id,
                        'image_path' => $vImg,
                        'alt_text' => $variantName,
                        'sort_order' => $variantCount++,
                        'is_main' => false,
                    ]);
                }
            }

            // Thêm ảnh chính của sản phẩm vào bảng product_images
            ProductImage::create([
                'product_id' => $product->id,
                'variant_id' => null,
                'image_path' => $featureImg,
                'alt_text' => $product->name,
                'sort_order' => 0,
                'is_main' => true,
            ]);

            $productCount++;
        }
    }
}
