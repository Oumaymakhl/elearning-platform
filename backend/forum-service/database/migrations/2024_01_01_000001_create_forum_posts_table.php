<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('forum_posts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('course_id');
            $table->unsignedBigInteger('user_id');
            $table->string('user_name');
            $table->string('user_role')->default('student');
            $table->string('title');
            $table->text('body');
            $table->timestamps();
        });
    }
    public function down() { Schema::dropIfExists('forum_posts'); }
};
