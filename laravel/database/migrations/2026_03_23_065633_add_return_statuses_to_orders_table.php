<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('status')->change();
            $table->string('payment_status')->change();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled'])->change();
            $table->enum('payment_status', ['unpaid', 'paid'])->change();
        });
    }
};
