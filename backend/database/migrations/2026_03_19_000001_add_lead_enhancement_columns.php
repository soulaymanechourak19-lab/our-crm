<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('source')->default('manual')->after('status');
            $table->timestamp('expires_at')->nullable()->after('source');
            $table->boolean('expired')->default(false)->after('expires_at');
        });

        // Update status enum to include 'hot' and 'expired'
        // SQLite doesn't support ALTER COLUMN for enums, so we handle both
        if (DB::getDriverName() === 'sqlite') {
            // SQLite: status is already a string column, no enum constraint
        } else {
            DB::statement("ALTER TABLE leads MODIFY COLUMN status ENUM('new','contacted','qualified','converted','hot','expired') DEFAULT 'new'");
        }
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['source', 'expires_at', 'expired']);
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE leads MODIFY COLUMN status ENUM('new','contacted','qualified','converted') DEFAULT 'new'");
        }
    }
};
