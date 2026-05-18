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
use App\Http\Controllers\api\v1\SepayController;
use App\Http\Controllers\api\v1\CommentController;
use App\Http\Controllers\api\v1\NotificationController;

use App\Http\Controllers\api\v1\PromotionController;
use App\Http\Controllers\api\v1\Storefront\CouponController;
use App\Http\Controllers\api\v1\Storefront\CartController;
use App\Http\Controllers\api\v1\Storefront\WishlistController;
use App\Http\Controllers\api\v1\Storefront\CheckoutController;
use App\Http\Resources\UserResource;

Route::group(['prefix' => 'v1'], function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    // Broadcasting Auth
    Broadcast::routes(['middleware' => ['auth:api']]);

    // Google OAuth
    Route::get('/auth/google/redirect', [SocialAuthController::class, 'redirectToGoogle']);
    Route::get('/auth/google/callback', [SocialAuthController::class, 'handleGoogleCallback']);

    // Xác nhận email
    Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verify'])->name('verification.verify');
    Route::post('/email/resend', [AuthController::class, 'resendVerificationEmail'])->name('verification.send');

    // Chat AI Public (Thêm middleware web để đọc được session/cookie từ trình duyệt)
    Route::post('/chat', [\App\Http\Controllers\api\v1\ChatbotController::class, 'chat'])->middleware(['web']);

    // Public routes for browsing
    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'index']);
        Route::get('/{slug}', [CategoryController::class, 'show']);
    });

    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::get('/search', [ProductController::class, 'search']);
        Route::get('/{slug}', [ProductController::class, 'show']);
        Route::get('/{id}/comments', [CommentController::class, 'index']);
    });

    Route::middleware('auth:api')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);

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
                Route::post('/', [UserController::class, 'store']);
                Route::get('/{id}', [UserController::class, 'show']);
                Route::put('/{id}', [UserController::class, 'update']);
                Route::delete('/{id}', [UserController::class, 'destroy']);
                Route::put('/{id}/role', [UserController::class, 'updateRole']);
            });
        });

        Route::prefix('customers')->group(function () {
            Route::post('/bulk-update-status', [CustomerController::class, 'bulkUpdateStatus']);
            Route::get('/', [CustomerController::class, 'index']);
            Route::get('/{id}', [CustomerController::class, 'show']);
            Route::post('/', [CustomerController::class, 'store']);
            Route::put('/{id}', [CustomerController::class, 'update']);
            Route::delete('/{id}', [CustomerController::class, 'destroy']);
        });

        Route::prefix('categories')->group(function () {
            Route::get('/', [CategoryController::class, 'index']); // Public/Staff can view
            Route::middleware('permission:categories.manage')->group(function () {
                Route::post('/bulk-delete', [CategoryController::class, 'bulkDelete']);
                Route::post('/', [CategoryController::class, 'store']);
                Route::put('/{slug}', [CategoryController::class, 'update']);
                Route::delete('/{slug}', [CategoryController::class, 'destroy']);
            });
        });

        Route::prefix('suppliers')->group(function () {
            Route::get('/', [SupplierController::class, 'index']); // Public/Staff can view
            Route::get('/{slug}', [SupplierController::class, 'show']);
            Route::middleware('permission:suppliers.manage')->group(function () {
                Route::post('/', [SupplierController::class, 'store']);
                Route::put('/{slug}', [SupplierController::class, 'update']);
                Route::delete('/{slug}', [SupplierController::class, 'destroy']);
            });
        });

        Route::prefix('products')->group(function () {
            Route::get('/', [ProductController::class, 'index']); // Public/Staff can view
            Route::middleware('permission:products.create')->post('/', [ProductController::class, 'store']);
            Route::middleware('permission:products.edit')->put('/{slug}', [ProductController::class, 'update']);
            Route::middleware('permission:products.delete')->group(function () {
                Route::post('/bulk-delete', [ProductController::class, 'bulkDelete']);
                Route::delete('/{slug}', [ProductController::class, 'destroy']);
            });
        });

        Route::prefix('orders')->group(function () {
            Route::post('/bulk-update', [OrderController::class, 'bulkUpdate']);
            Route::get('/', [OrderController::class, 'index']);
            Route::post('/', [OrderController::class, 'store']);
            Route::get('/{id}', [OrderController::class, 'show']);
            Route::put('/{id}', [OrderController::class, 'update']);
            Route::patch('/{id}/cancel', [OrderController::class, 'cancel']);
            Route::patch('/{id}/refund', [OrderController::class, 'refund']);
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
            Route::post('/', [StockReceiptController::class, 'store']);
            Route::get('/{id}', [StockReceiptController::class, 'show']);
            Route::post('/{id}/confirm', [StockReceiptController::class, 'confirm']);
        });

        Route::prefix('inventory')->group(function () {
            Route::get('/', [InventoryController::class, 'index']);
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

        // Promotions
        Route::apiResource('promotions', PromotionController::class);
        Route::post('promotions/apply', [PromotionController::class, 'apply']);
        Route::post('promotions/eligible', [PromotionController::class, 'getEligiblePromotions']);

        // Storefront Cart (Redis)
        Route::prefix('cart')->group(function () {
            Route::get('/', [CartController::class, 'index']);
            Route::post('/', [CartController::class, 'store']);
            Route::put('/{variantId}', [CartController::class, 'update']);
            Route::delete('/{variantId}', [CartController::class, 'destroy']);
            Route::post('/clear', [CartController::class, 'clear']);
            Route::post('/sync', [CartController::class, 'sync']);
        });

        // Storefront Wishlist (Redis)
        Route::prefix('wishlist')->group(function () {
            Route::get('/', [WishlistController::class, 'index']);
            Route::post('/toggle', [WishlistController::class, 'toggle']);
            Route::post('/clear', [WishlistController::class, 'clear']);
        });

        // Storefront Orders
        Route::prefix('my-orders')->group(function () {
            Route::get('/', [\App\Http\Controllers\api\v1\Storefront\OrderController::class, 'index']);
            Route::get('/{id}', [\App\Http\Controllers\api\v1\Storefront\OrderController::class, 'show']);
            Route::patch('/{id}/cancel', [\App\Http\Controllers\api\v1\Storefront\OrderController::class, 'cancel']);
            Route::post('/{id}/return', [\App\Http\Controllers\api\v1\Storefront\OrderController::class, 'return']);
            Route::post('/{id}/notify-pending-payment', [\App\Http\Controllers\api\v1\Storefront\OrderController::class, 'notifyPendingPayment']);
        });

        // Storefront Checkout (Cart + Buy Now)
        Route::post('/checkout', [CheckoutController::class, 'checkout']);

        Route::get('/user/wallet-transactions', [UserController::class, 'walletTransactions']);

        Route::get('/user', function (Request $request) {
            $user = $request->user()->load(['role.permissions', 'customerProfile']);
            return new UserResource($user);
        });

        // Comment routes
        Route::prefix('comments')->group(function () {
            Route::get('/my-comments', [CommentController::class, 'myComments']); // Lấy đánh giá cá nhân
            Route::post('/', [CommentController::class, 'store']);
            Route::put('/{id}', [CommentController::class, 'update']); // Sửa đánh giá
            Route::delete('/{id}', [CommentController::class, 'destroy']);
            Route::get('/can-review/{productId}', [CommentController::class, 'checkCanReview']);
            
            // Admin management
            Route::middleware('permission:admin.manage')->group(function () {
                Route::get('/admin/all', [CommentController::class, 'adminIndex']); // Danh sách cho admin
                Route::patch('/{id}/reply', [CommentController::class, 'adminReply']); // Admin phản hồi
                Route::patch('/{id}/toggle-visibility', [CommentController::class, 'toggleVisibility']); // Ẩn/hiện
            });
        });

        // Notification routes
        Route::prefix('notifications')->group(function () {
            Route::get('/', [NotificationController::class, 'index']);
            Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
            Route::post('/mark-read', [NotificationController::class, 'markAsRead']);
            Route::delete('/{id}', [NotificationController::class, 'destroy']);
        });

        // Chat AI routes (Auth required)
        Route::prefix('chat')->group(function () {
            Route::get('/history', [\App\Http\Controllers\api\v1\ChatbotController::class, 'history']);
            Route::delete('/history', [\App\Http\Controllers\api\v1\ChatbotController::class, 'clearHistory']);
        });
    });

    // Webhooks should not be authenticated
    Route::post('/payments/vnpay/ipn', [PaymentController::class, 'vnpayIpn']);
    Route::post('/payments/sepay/webhook', [SepayController::class, 'webhook']);
    Route::get('/payments/sepay/check-status', [SepayController::class, 'checkStatus']);


    // Public Promotions / Coupons endpoints
    Route::prefix('public')->group(function () {
        Route::post('coupons/apply', [CouponController::class, 'apply']);
    });
});
