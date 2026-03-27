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
        Schema::create('customer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('phone')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->text('address')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->boolean('is_active')->default(true);
            $table->decimal('total_spent', 12, 0)->default(0);
            $table->integer('total_orders')->default(0);
            $table->string('loyalty_tier')->default('bronze')->comment('Hạng thành viên (bronze, silver, gold, platinum)');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_profiles');
    }
};
