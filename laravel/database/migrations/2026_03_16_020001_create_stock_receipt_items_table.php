<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_receipt_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_receipt_id')
                ->constrained('stock_receipts')
                ->onDelete('cascade');
            $table->foreignId('variant_id')
                ->constrained('product_variants')
                ->onDelete('restrict');
            $table->integer('quantity');                    // Số lượng nhập
            $table->decimal('unit_price', 15, 2);           // Giá nhập mỗi đơn vị
            $table->decimal('total_price', 15, 2);          // quantity * unit_price
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_receipt_items');
    }
};
