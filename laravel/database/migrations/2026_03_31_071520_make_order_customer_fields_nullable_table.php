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
        Schema::table('orders', function (Blueprint $table) {
            $table->string('customer_name')->nullable()->change();
            $table->string('customer_phone')->nullable()->change();
            $table->text('customer_address')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('customer_name')->nullable(false)->change();
            $table->string('customer_phone')->nullable(false)->change();
            $table->text('customer_address')->nullable(false)->change();
        });
    }
};
