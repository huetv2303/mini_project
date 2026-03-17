<?php

namespace App\Providers;

use App\Interfaces\CategoryRepositoryInterface;
use App\Interfaces\Product\ProductRepositoryInterface;
use App\Interfaces\Product\ProductVariantRepositoryInterface;
use App\Interfaces\Product\ProductAttributeRepositoryInterface;
use App\Interfaces\Product\ProductImageRepositoryInterface;
use App\Interfaces\InventoryRepositoryInterface;
use App\Interfaces\SupplierRepositoryInterface;
use App\Interfaces\UserRepositoryInterface;
use App\Interfaces\Order\OrderRepositoryInterface;
use App\Interfaces\StockReceiptRepositoryInterface;
use App\Repositories\CategoryRepository;
use App\Repositories\Product\ProductRepository;
use App\Repositories\Product\ProductVariantRepository;
use App\Repositories\Product\ProductAttributeRepository;
use App\Repositories\Product\ProductImageRepository;
use App\Repositories\InventoryRepository;
use App\Repositories\SupplierRepository;
use App\Repositories\UserRepository;
use App\Repositories\Order\OrderRepository;
use App\Repositories\StockReceiptRepository;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Permission;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(CategoryRepositoryInterface::class, CategoryRepository::class);
        $this->app->bind(SupplierRepositoryInterface::class, SupplierRepository::class);
        $this->app->bind(ProductRepositoryInterface::class, ProductRepository::class);
        $this->app->bind(ProductVariantRepositoryInterface::class, ProductVariantRepository::class);
        $this->app->bind(ProductAttributeRepositoryInterface::class, ProductAttributeRepository::class);
        $this->app->bind(ProductImageRepositoryInterface::class, ProductImageRepository::class);
        $this->app->bind(InventoryRepositoryInterface::class, InventoryRepository::class);
        $this->app->bind(OrderRepositoryInterface::class, OrderRepository::class);
        $this->app->bind(StockReceiptRepositoryInterface::class, StockReceiptRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Tự động định nghĩa các Gate dựa trên database permissions
        try {
            if (app()->runningInConsole() === false) {
                Permission::all()->each(function ($permission) {
                    Gate::define($permission->code, function ($user) use ($permission) {
                        return $user->hasPermission($permission->code);
                    });
                } );
            }
        } catch (\Exception $e) {
            // Tránh lỗi khi migrate chưa có table permissions
        }
    }
}
