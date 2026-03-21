<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_tracking', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->nullable()->constrained('leads')->onDelete('set null');
            $table->string('session_id');
            $table->json('pages_viewed')->nullable();
            $table->integer('time_on_site')->default(0); // seconds
            $table->string('entry_page')->nullable();
            $table->string('exit_page')->nullable();
            $table->string('device_type')->nullable();
            $table->string('location')->nullable(); // IP geolocation
            $table->integer('score')->default(0); // 1-100
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('last_activity')->nullable();
            $table->timestamps();

            $table->index('session_id');
            $table->index('score');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_tracking');
    }
};
