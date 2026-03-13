<?php

use App\Http\Controllers\api\v1\SupplierController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\api\v1\AuthController;
use App\Http\Controllers\api\v1\CategoryController;

use App\Http\Controllers\api\v1\ProductController;

Route::prefix('v1/')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    
    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'index']);
        Route::get('/{slug}', [CategoryController::class, 'show']);
        Route::post('/', [CategoryController::class, 'store']);
        Route::put('/{slug}', [CategoryController::class, 'update']);
        Route::delete('/{slug}', [CategoryController::class, 'destroy']);
    });

    Route::prefix('suppliers')->group(function () {
        Route::get('/', [SupplierController::class, 'index']);
        Route::get('/{slug}', [SupplierController::class, 'show']);
        Route::post('/', [SupplierController::class, 'store']);
        Route::put('/{slug}', [SupplierController::class, 'update']);
        Route::delete('/{slug}', [SupplierController::class, 'destroy']);
    });

    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::post('/', [ProductController::class, 'store']);
    });
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:api');
