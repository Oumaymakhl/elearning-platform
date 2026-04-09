<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('visited_sub_chapters', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('course_id');
            $table->unsignedBigInteger('sub_chapter_id');
            $table->timestamps();
            $table->unique(['user_id', 'course_id', 'sub_chapter_id']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('visited_sub_chapters');
    }
};
