<?php
namespace App\Services;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class UploadService{
   public function uploadFiles(array $files, string $folder = 'uploads'){
        $uploaded = [];
        foreach($files as $file){
            if($file instanceof UploadedFile){
                $path = Storage::disk('public')->putFile($folder, $file);
                $uploaded[] = [
                    'url' => Storage::url($path),
                    'path' => $path,
                ];
            }
        }
        return $uploaded;
    }

    public function uploadFile(UploadedFile $file, string $folder = 'uploads'){
        $path = Storage::disk('public')->putFile($folder, $file);
        return [
            'url' => Storage::url($path),
            'path' => $path,
        ];
    }

    public function deleteFile(?string $path){
        if($path && Storage::disk('public')->exists($path)){
            return Storage::disk('public')->delete($path);
        }
        return false;
    }
}