<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('exercise_questions')->onDelete('cascade');
            $table->unsignedBigInteger('user_id');
            $table->text('code');
            $table->text('output')->nullable();
            $table->integer('tests_passed')->default(0);
            $table->integer('tests_total')->default(0);
            $table->boolean('passed')->default(false);
            $table->integer('score')->default(0);
            $table->string('error')->nullable();
            $table->timestamp('executed_at')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('submissions');
    }
};
