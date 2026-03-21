<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('discount_id')->nullable()->after('price')->constrained('discounts')->onDelete('set null');
            $table->decimal('discount_amount', 10, 2)->default(0)->after('discount_id');
            $table->foreignId('converted_from_lead_id')->nullable()->after('discount_amount')->constrained('leads')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['discount_id']);
            $table->dropForeign(['converted_from_lead_id']);
            $table->dropColumn(['discount_id', 'discount_amount', 'converted_from_lead_id']);
        });
    }
};
