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
        Schema::table('products', function (Blueprint $table) {
            $table->bigInteger('category_id')->nullable()->change();
            $table->bigInteger('supplier_id')->nullable()->change();
        });

        Schema::table('stock_receipts', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
        });

        Schema::table('stock_receipts', function (Blueprint $table) {
            $table->unsignedBigInteger('supplier_id')->nullable()->change();
        });

        Schema::table('stock_receipts', function (Blueprint $table) {
            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers')
                ->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->bigInteger('category_id')->nullable(false)->change();
            $table->bigInteger('supplier_id')->nullable(false)->change();
        });

        Schema::table('stock_receipts', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
        });

        Schema::table('stock_receipts', function (Blueprint $table) {
            $table->unsignedBigInteger('supplier_id')->nullable(false)->change();
        });

        Schema::table('stock_receipts', function (Blueprint $table) {
            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers')
                ->onDelete('restrict');
        });
    }
};
