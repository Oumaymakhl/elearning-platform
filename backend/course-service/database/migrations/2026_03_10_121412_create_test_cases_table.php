<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('test_cases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('exercise_questions')->onDelete('cascade');
            $table->text('input')->nullable();
            $table->text('expected_output');
            $table->boolean('is_hidden')->default(false); // cas cachés pour anti-triche
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('test_cases');
    }
};
