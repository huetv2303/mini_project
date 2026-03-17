<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('variant_id')
                ->constrained('product_variants')
                ->onDelete('restrict');
            $table->enum('type', ['in', 'out', 'adjustment']);
            // in         → nhập kho (tồn tăng)
            // out        → xuất kho (tồn giảm)
            // adjustment → điều chỉnh thủ công

            $table->string('reference_type');
            // stock_receipt | order | order_cancel | manual
            $table->unsignedBigInteger('reference_id')->nullable();

            $table->integer('quantity_before');             // Tồn kho TRƯỚC giao dịch
            $table->integer('quantity_change');             // Số thay đổi (dương = tăng, âm = giảm)
            $table->integer('quantity_after');              // Tồn kho SAU giao dịch

            $table->text('note')->nullable();
            $table->foreignId('user_id')
                ->constrained('users')
                ->onDelete('restrict');

            $table->timestamp('created_at')->useCurrent();
            // Không có updated_at — transaction không bao giờ được sửa
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
    }
};
