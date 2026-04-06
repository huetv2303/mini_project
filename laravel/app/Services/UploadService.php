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


    public function uploadFile(UploadedFile $file, string $folder = 'uploads', $width = null, $height = null)
    {
        $extension = $file->getClientOriginalExtension();
        $filename = uniqid() . '.webp';
        $path = $folder . '/' . $filename;

        if (in_array(strtolower($extension), ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            $image = $this->manager->read($file);

            if ($width && $height) {
                $image->cover($width, $height);
            } elseif ($width || $height) {
                $image->scale($width, $height);
            } elseif ($image->width() > 1200) {
                $image->scale(width: 1200);
            }
            $encoded = $image->toWebp(80);

            Storage::disk('public')->put($path, (string) $encoded);
        } else {
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
