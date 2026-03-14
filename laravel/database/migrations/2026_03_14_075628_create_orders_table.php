<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();                           // Mã đơn hàng tự sinh
            $table->foreignId('payment_method_id')
                  ->nullable()
                  ->constrained('payment_methods')
                  ->nullOnDelete();
            $table->foreignId('created_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();                                     // Nhân viên lên đơn
            $table->enum('status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
                  ->default('pending');
            $table->decimal('total_amount', 15, 2)->default(0);        // Tổng tiền trước giảm giá
            $table->decimal('discount_amount', 15, 2)->default(0);     // Giảm giá
            $table->decimal('final_amount', 15, 2)->default(0);        // Tiền thực trả
            $table->enum('payment_status', ['unpaid', 'paid'])->default('unpaid');
            $table->text('note')->nullable();
            // Thông tin khách hàng (nhân viên nhập tay)
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->text('customer_address');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
