<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number')->unique();        // TK-000001
            $table->string('title');
            $table->text('description');
            $table->enum('status', ['open', 'in_progress', 'resolved', 'closed'])->default('open');
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->unsignedBigInteger('customer_id')->nullable();  // Lien CRM
            $table->unsignedBigInteger('assigned_to')->nullable();  // Agent SAV
            $table->unsignedBigInteger('created_by')->nullable();   // Utilisateur créateur
            $table->string('source')->default('web');               // web, email, phone, chatbot
            $table->string('category')->nullable();                 // Catégorie/intention détectée
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
            $table->foreign('assigned_to')->references('id')->on('users')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();

            $table->index('status');
            $table->index('priority');
            $table->index('assigned_to');
            $table->index('customer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
