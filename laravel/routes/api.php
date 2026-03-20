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
use App\Http\Controllers\api\v1\RoleController;
use App\Http\Controllers\api\v1\PermissionController;
use App\Http\Controllers\api\v1\UserController;
use App\Http\Controllers\api\v1\CustomerController;
use App\Http\Controllers\api\v1\SocialAuthController;

Route::prefix('v1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    // Google OAuth
    Route::get('/auth/google/redirect', [SocialAuthController::class, 'redirectToGoogle']);
    Route::get('/auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback']);

    // Xác nhận email
    Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verify'])->name('verification.verify');
    Route::post('/email/resend', [AuthController::class, 'resendVerificationEmail'])->name('verification.send');

    Route::middleware('auth:api')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);

        Route::middleware('permission:admin.manage')->group(function () {
            Route::prefix('roles')->group(function () {
                Route::get('/', [RoleController::class, 'index']);
                Route::get('/{id}', [RoleController::class, 'show']);
                Route::post('/', [RoleController::class, 'store']);
                Route::put('/{id}/permissions', [RoleController::class, 'updatePermissions']);
            });

            Route::get('/permissions', [PermissionController::class, 'index']);

            Route::prefix('users')->group(function () {
                Route::get('/', [UserController::class, 'index']);
                Route::put('/{id}/role', [UserController::class, 'updateRole']);
            });
        });

        Route::prefix('customers')->group(function () {
            Route::get('/', [CustomerController::class, 'index']);
            Route::get('/{id}', [CustomerController::class, 'show']);
            Route::post('/', [CustomerController::class, 'store']);
            Route::put('/{id}', [CustomerController::class, 'update']);
            Route::delete('/{id}', [CustomerController::class, 'destroy']);
        });


        Route::prefix('categories')->group(function () {
            Route::post('/bulk-delete', [CategoryController::class, 'bulkDelete'])->middleware('permission:categories.manage');
            Route::get('/', [CategoryController::class, 'index']);
            Route::get('/{slug}', [CategoryController::class, 'show']);
            Route::post('/', [CategoryController::class, 'store']);
            // ->middleware('permission:categories.manage');
            Route::put('/{slug}', [CategoryController::class, 'update'])->middleware('permission:categories.manage');
            Route::delete('/{slug}', [CategoryController::class, 'destroy'])->middleware('permission:categories.manage');
        });

        Route::prefix('suppliers')->group(function () {
            Route::get('/', [SupplierController::class, 'index']);
            Route::get('/{slug}', [SupplierController::class, 'show']);
            Route::post('/', [SupplierController::class, 'store'])->middleware('permission:products.create');
            Route::put('/{slug}', [SupplierController::class, 'update'])->middleware('permission:products.edit');
            Route::delete('/{slug}', [SupplierController::class, 'destroy'])->middleware('permission:products.delete');
        });

        Route::prefix('products')->group(function () {
            Route::post('/bulk-delete', [ProductController::class, 'bulkDelete']);
            Route::get('/', [ProductController::class, 'index']);
            Route::get('/{slug}', [ProductController::class, 'show']);
            Route::post('/', [ProductController::class, 'store']);
            // ->middleware('permission:products.create');
            Route::put('/{slug}', [ProductController::class, 'update']);
            // ->middleware('permission:products.edit');
            Route::delete('/{slug}', [ProductController::class, 'destroy']);
            // ->middleware('permission:products.delete');
        });

        Route::prefix('orders')->group(function () {
            Route::get('/', [OrderController::class, 'index'])->middleware('permission:orders.view');
            Route::post('/', [OrderController::class, 'store']); // Ai đã đăng nhập cũng có thể tạo order (khách hàng/nv)
            Route::get('/{id}', [OrderController::class, 'show'])->middleware('permission:orders.view');
            Route::put('/{id}', [OrderController::class, 'update']);
            Route::patch('/{id}/cancel', [OrderController::class, 'cancel']);
        });

        Route::prefix('stock-receipts')->group(function () {
            Route::get('/', [StockReceiptController::class, 'index'])->middleware('permission:products.view');
            Route::post('/', [StockReceiptController::class, 'store'])->middleware('permission:products.create');
            Route::get('/{id}', [StockReceiptController::class, 'show'])->middleware('permission:products.view');
            Route::post('/{id}/confirm', [StockReceiptController::class, 'confirm'])->middleware('permission:products.create');
        });

        Route::prefix('inventory')->group(function () {
            Route::get('/', [InventoryController::class, 'index'])->middleware('permission:products.view');
            Route::get('/{variantId}/history', [InventoryController::class, 'history']);
        });

        Route::get('/user', function (Request $request) {
            $user = $request->user()->load('role.permissions');
            return new \App\Http\Resources\UserResource($user);
        });
    });
});
