<?php

use App\Http\Controllers\api\v1\SupplierController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\api\v1\AuthController;
use App\Http\Controllers\api\v1\CategoryController;

use App\Http\Controllers\api\v1\ProductController;
use App\Http\Controllers\api\v1\OrderController;
use App\Http\Controllers\api\v1\PaymentMethodController;
use \App\Http\Controllers\api\v1\StockReceiptController;
use \App\Http\Controllers\api\v1\InventoryController;
use App\Http\Controllers\api\v1\RoleController;
use App\Http\Controllers\api\v1\PermissionController;
use App\Http\Controllers\api\v1\UserController;
use App\Http\Controllers\api\v1\CustomerController;
use App\Http\Controllers\api\v1\SocialAuthController;
use App\Http\Controllers\api\v1\OrderReturnController;
use App\Http\Controllers\api\v1\ShippingMethodController;
use App\Http\Controllers\api\v1\TaxRateController;
use App\Http\Controllers\api\v1\DashboardController;
use App\Http\Controllers\api\v1\PaymentController;

Route::group(['prefix' => 'v1'], function () {
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
            Route::post('/bulk-delete', [CategoryController::class, 'bulkDelete']);
            // ->middleware('permission:categories.manage');
            Route::get('/', [CategoryController::class, 'index']);
            Route::get('/{slug}', [CategoryController::class, 'show']);
            Route::post('/', [CategoryController::class, 'store']);
            // ->middleware('permission:categories.manage');
            Route::put('/{slug}', [CategoryController::class, 'update']);
            // ->middleware('permission:categories.manage');
            Route::delete('/{slug}', [CategoryController::class, 'destroy']);
            // ->middleware('permission:categories.manage');
        });

        Route::prefix('suppliers')->group(function () {
            Route::get('/', [SupplierController::class, 'index']);
            Route::get('/{slug}', [SupplierController::class, 'show']);
            Route::post('/', [SupplierController::class, 'store']);
            // ->middleware('permission:products.create');
            Route::put('/{slug}', [SupplierController::class, 'update']);
            // ->middleware('permission:products.edit');
            Route::delete('/{slug}', [SupplierController::class, 'destroy']);
            // ->middleware('permission:products.delete');
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
            Route::post('/bulk-update', [OrderController::class, 'bulkUpdate']);
            Route::get('/', [OrderController::class, 'index']);
            // ->middleware('permission:orders.view');
            Route::post('/', [OrderController::class, 'store']); // Ai đã đăng nhập cũng có thể tạo order (khách hàng/nv)
            Route::get('/{id}', [OrderController::class, 'show']);
            // ->middleware('permission:orders.view');
            Route::put('/{id}', [OrderController::class, 'update']);
            Route::patch('/{id}/cancel', [OrderController::class, 'cancel']);
            Route::patch('/{id}/update-payment-method', [OrderController::class, 'updatePaymentMethod']);
        });

        Route::prefix('order-returns')->group(function () {
            Route::post('/bulk-refund', [OrderReturnController::class, 'bulkRefund']);
            Route::get('/', [OrderReturnController::class, 'index']);
            Route::post('/', [OrderReturnController::class, 'store']);
            Route::get('/{id}', [OrderReturnController::class, 'show']);
            Route::patch('/{id}/receive', [OrderReturnController::class, 'receive']);
            Route::patch('/{id}/refund', [OrderReturnController::class, 'refund']);
        });

        Route::prefix('stock-receipts')->group(function () {
            Route::get('/', [StockReceiptController::class, 'index']);
            // ->middleware('permission:products.view');
            Route::post('/', [StockReceiptController::class, 'store']);
            // ->middleware('permission:products.create');
            Route::get('/{id}', [StockReceiptController::class, 'show']);
            // ->middleware('permission:products.view');
            Route::post('/{id}/confirm', [StockReceiptController::class, 'confirm']);
            // ->middleware('permission:products.create');
        });

        Route::prefix('inventory')->group(function () {
            Route::get('/', [InventoryController::class, 'index']);
            // ->middleware('permission:products.view');
            Route::get('/report', [InventoryController::class, 'report']);
            Route::get('/{variantId}/history', [InventoryController::class, 'history']);
            Route::post('/adjust', [InventoryController::class, 'adjust']);
            Route::post('/import', [InventoryController::class, 'import']);
        });

        Route::get('/dashboard/statistics', [DashboardController::class, 'statistics']);

        Route::prefix('payment-methods')->group(function () {
            Route::get('/', [PaymentMethodController::class, 'index']);
            Route::post('/', [PaymentMethodController::class, 'store']);
            Route::get('/{id}', [PaymentMethodController::class, 'show']);
            Route::put('/{id}', [PaymentMethodController::class, 'update']);
            Route::delete('/{id}', [PaymentMethodController::class, 'destroy']);
        });
        // Payment Processing
        Route::prefix('payments')->group(function () {
            Route::post('/vnpay/create', [PaymentController::class, 'vnpayCreate']);
            Route::get('/vnpay/verify', [PaymentController::class, 'vnpayVerify']);
            // Get Bank Config for VietQR
            Route::get('/bank-config', [PaymentController::class, 'bankConfig']);
        });

        // Shipping Methods
        Route::prefix('shipping-methods')->group(function () {
            Route::get('/', [ShippingMethodController::class, 'index']);
            Route::get('/active', [ShippingMethodController::class, 'active']);
            Route::post('/', [ShippingMethodController::class, 'store']);
            Route::put('/{id}', [ShippingMethodController::class, 'update']);
            Route::delete('/{id}', [ShippingMethodController::class, 'destroy']);
        });

        // Tax Rates
        Route::prefix('tax-rates')->group(function () {
            Route::get('/statistics', [TaxRateController::class, 'statistics']);
            Route::get('/', [TaxRateController::class, 'index']);
            Route::get('/active', [TaxRateController::class, 'active']);
            Route::post('/', [TaxRateController::class, 'store']);
            Route::put('/{id}', [TaxRateController::class, 'update']);
            Route::delete('/{id}', [TaxRateController::class, 'destroy']);
        });

        Route::get('/user', function (Request $request) {
            $user = $request->user()->load('role.permissions');
            return new \App\Http\Resources\UserResource($user);
        });
    });

    // Webhooks should not be authenticated
    Route::post('/payments/vnpay/ipn', [PaymentController::class, 'vnpayIpn']);
});
