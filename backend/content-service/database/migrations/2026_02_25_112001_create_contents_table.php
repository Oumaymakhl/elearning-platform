<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id'); // référence au course-service
            $table->foreignId('uploader_id'); // référence au user-service
            $table->string('title');
            $table->enum('type', ['pdf', 'video', 'link', 'text']);
            $table->string('url')->nullable();   // pour les liens ou vidéos externes
            $table->string('file_path')->nullable(); // pour les fichiers uploadés
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contents');
    }
};
