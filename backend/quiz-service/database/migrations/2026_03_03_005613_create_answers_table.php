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
        Schema::create('answers', function (Blueprint $table) {
    $table->id();
    $table->foreignId('attempt_id')->constrained()->onDelete('cascade');
    $table->foreignId('question_id')->constrained()->onDelete('cascade');
    $table->foreignId('option_id')->nullable()->constrained()->onDelete('cascade');
    $table->text('text_answer')->nullable(); // pour réponses ouvertes (si on en ajoute)
    $table->boolean('is_correct')->nullable();
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('answers');
    }
};
