<?php

use App\Http\Controllers\api\v1\SupplierController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\api\v1\AuthController;
use App\Http\Controllers\api\v1\CategoryController;

use App\Http\Controllers\api\v1\ProductController;
use App\Http\Controllers\api\v1\OrderController;
use \App\Http\Controllers\api\v1\StockReceiptController;
use \App\Http\Controllers\api\v1\InventoryController;

Route::prefix('v1/')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::middleware('auth:api')->group(function () {
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
            Route::put('/{slug}', [ProductController::class, 'update']);
            Route::delete('/{slug}', [ProductController::class, 'destroy']);
        });

        // Order routes - yêu cầu đăng nhập
        Route::prefix('orders')->group(function () {
            Route::get('/', [OrderController::class, 'index']);
            Route::post('/', [OrderController::class, 'store']);
            Route::get('/{id}', [OrderController::class, 'show']);
            Route::put('/{id}', [OrderController::class, 'update']);
            Route::patch('/{id}/cancel', [OrderController::class, 'cancel']);
        });

        // Stock Receipt routes - yêu cầu đăng nhập
        Route::prefix('stock-receipts')->group(function () {
            Route::get('/', [StockReceiptController::class, 'index']);
            Route::post('/', [StockReceiptController::class, 'store']);
            Route::get('/{id}', [StockReceiptController::class, 'show']);
            Route::post('/{id}/confirm', [StockReceiptController::class, 'confirm']);
        });

        // Inventory routes - yêu cầu đăng nhập
        Route::prefix('inventory')->group(function () {
            Route::get('/', [InventoryController::class, 'index']);
            Route::get('/{variantId}/history', [InventoryController::class, 'history']);
        });
    });
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:api');
