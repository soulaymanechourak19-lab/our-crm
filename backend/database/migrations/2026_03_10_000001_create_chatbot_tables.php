<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chatbot_intents', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();         // e.g. 'count_customers'
            $table->string('description')->nullable(); // human-readable label
            $table->timestamps();
        });

        Schema::create('chatbot_training_examples', function (Blueprint $table) {
            $table->id();
            $table->foreignId('intent_id')->constrained('chatbot_intents')->cascadeOnDelete();
            $table->string('text');                    // the example phrase
            $table->timestamps();
        });

        Schema::create('chatbot_prediction_logs', function (Blueprint $table) {
            $table->id();
            $table->string('message');
            $table->string('predicted_intent')->nullable();
            $table->float('confidence')->nullable();
            $table->boolean('used_fallback')->default(false);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chatbot_prediction_logs');
        Schema::dropIfExists('chatbot_training_examples');
        Schema::dropIfExists('chatbot_intents');
    }
};
