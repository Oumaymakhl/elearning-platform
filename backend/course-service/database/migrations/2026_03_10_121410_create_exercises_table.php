<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sub_chapter_id')->constrained('sub_chapters')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('language', ['python', 'java', 'cpp', 'php', 'node'])->default('python');
            $table->integer('max_score')->default(100);
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('exercises');
    }
};
