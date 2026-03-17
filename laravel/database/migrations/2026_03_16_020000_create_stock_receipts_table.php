<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();               // Mã phiếu nhập: PN-20260316-001
            $table->foreignId('supplier_id')
                ->constrained('suppliers')
                ->onDelete('restrict');
            $table->foreignId('created_by')
                ->constrained('users')
                ->onDelete('restrict');
            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('pending');
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->text('note')->nullable();
            $table->timestamp('received_at')->nullable();   // Ngày nhận hàng thực tế
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_receipts');
    }
};
