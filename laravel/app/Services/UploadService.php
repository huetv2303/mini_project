<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class UploadService
{
    protected $manager;

    public function __construct()
    {
        // Khởi tạo ImageManager với driver GD
        $this->manager = new ImageManager(new Driver());
    }

    public function uploadFiles(array $files, string $folder = 'uploads', $width = null, $height = null)
    {
        $uploaded = [];
        foreach ($files as $file) {
            if ($file instanceof UploadedFile) {
                $uploaded[] = $this->uploadFile($file, $folder, $width, $height);
            }
        }
        return $uploaded;
    }

    /**
     * Upload và tối ưu hóa hình ảnh
     */
    public function uploadFile(UploadedFile $file, string $folder = 'uploads', $width = null, $height = null)
    {
        $extension = $file->getClientOriginalExtension();
        // Luôn lưu dưới dạng webp để tối ưu nhất
        $filename = uniqid() . '.webp';
        $path = $folder . '/' . $filename;

        // Kiểm tra nếu là file ảnh thì mới resize/nén
        if (in_array(strtolower($extension), ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            $image = $this->manager->read($file);

            // Resize
            if ($width && $height) {
                // Resize và crop để khớp kích thước chính xác (thường dùng cho ảnh vuông sản phẩm)
                $image->cover($width, $height);
            } elseif ($width || $height) {
                // Scale theo tỉ lệ nếu chỉ truyền 1 trong 2
                $image->scale($width, $height);
            } elseif ($image->width() > 1200) {
                // Mặc định giới hạn chiều rộng 1200px nếu không truyền tham số
                $image->scale(width: 1200);
            }

            // Nén ảnh sang WebP (chất lượng 80)
            $encoded = $image->toWebp(80);

            // Lưu vào storage
            Storage::disk('public')->put($path, (string) $encoded);
        } else {
            // Nếu không phải ảnh (ví dụ PDF), lưu bình thường với extension gốc
            $filename = uniqid() . '.' . $extension;
            $path = $folder . '/' . $filename;
            $path = Storage::disk('public')->putFileAs($folder, $file, $filename);
        }

        return [
            'url' => Storage::url($path),
            'path' => $path,
        ];
    }


    public function deleteFile(?string $path)
    {
        if ($path && Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->delete($path);
        }
        return false;
    }
}
