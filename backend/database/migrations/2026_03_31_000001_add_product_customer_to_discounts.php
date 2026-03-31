<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('discounts', function (Blueprint $table) {
            $table->unsignedBigInteger('product_id')->nullable()->after('is_active');
            $table->unsignedBigInteger('customer_id')->nullable()->after('product_id');

            $table->foreign('product_id')->references('id')->on('products')->onDelete('set null');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('discounts', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
            $table->dropForeign(['customer_id']);
            $table->dropColumn(['product_id', 'customer_id']);
        });
    }
};
