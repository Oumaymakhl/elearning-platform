<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user1_id');
            $table->string('user1_name');
            $table->string('user1_avatar')->nullable();
            $table->unsignedBigInteger('user2_id');
            $table->string('user2_name');
            $table->string('user2_avatar')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();
            $table->unique(['user1_id', 'user2_id']);
        });
    }
    public function down() { Schema::dropIfExists('conversations'); }
};
