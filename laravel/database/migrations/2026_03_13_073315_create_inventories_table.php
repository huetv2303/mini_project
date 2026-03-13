<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('variant_id')
                ->unique()
                ->constrained('product_variants')
                ->onDelete('restrict');
            $table->integer('quantity')->default(0);      // tổng tồn kho
            $table->integer('reserved')->default(0);      // đang chờ xuất (đơn hàng chờ xử lý)
            $table->integer('min_quantity')->default(0);  // ngưỡng cảnh báo hết hàng
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventories');
    }
};
