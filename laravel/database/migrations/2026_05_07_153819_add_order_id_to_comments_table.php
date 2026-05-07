<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            // Tạm thời tắt foreign key checks để xóa index nếu cần, 
            // hoặc drop foreign key trước.
            $table->dropForeign(['user_id']);
            $table->dropForeign(['product_id']);
            
            $table->dropUnique(['user_id', 'product_id']);
            
            $table->foreignId('order_id')->after('product_id')->nullable()->constrained()->onDelete('cascade');
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            
            $table->unique(['order_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->dropUnique(['order_id', 'product_id']);
            $table->dropConstrainedForeignId('order_id');
            $table->unique(['user_id', 'product_id']);
        });
    }
};
