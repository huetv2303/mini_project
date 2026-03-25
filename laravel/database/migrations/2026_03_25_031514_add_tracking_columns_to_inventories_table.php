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
        Schema::table('inventories', function (Blueprint $table) {
            if (!Schema::hasColumn('inventories', 'reserved')) {
                $table->integer('reserved')->default(0)->after('quantity');
            }
            $table->integer('unavailable')->default(0)->after('reserved'); // Hàng lỗi hỏng / Không thể bán
            $table->integer('returning')->default(0)->after('unavailable'); // Hàng đang đợi trả về kho
            $table->integer('packing')->default(0)->after('returning'); // Hàng đang trong quá trình đóng gói
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            $table->dropColumn(['unavailable', 'returning', 'packing']);
            // Giữ lại reserved vì nó quan trọng cho logic đặt chỗ chúng ta vừa làm
        });
    }
};
