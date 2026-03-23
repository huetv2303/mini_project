<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_returns', function (Blueprint $table) {
            $table->string('receive_status')->default('pending')->after('reason'); // pending, received
            $table->string('refund_status')->default('pending')->after('receive_status'); // pending, refunded, not_needed (if order was unpaid)
            $table->string('status')->default('returning')->change(); // returning, completed, cancelled
        });
    }

    public function down(): void
    {
        Schema::table('order_returns', function (Blueprint $table) {
            $table->dropColumn(['receive_status', 'refund_status']);
            $table->string('status')->default('completed')->change();
        });
    }
};
