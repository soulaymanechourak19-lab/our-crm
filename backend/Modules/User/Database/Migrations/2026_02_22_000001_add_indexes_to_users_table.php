<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add performance indexes to the users table.
     * Indexes on 'role' and 'deleted_at' speed up role-based queries
     * and soft-delete exclusion checks.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Speeds up WHERE role = ? queries (admin checks, agent filters)
            $table->index('role', 'users_role_index');

            // Speeds up soft delete scopes (WHERE deleted_at IS NULL)
            $table->index('deleted_at', 'users_deleted_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_role_index');
            $table->dropIndex('users_deleted_at_index');
        });
    }
};
