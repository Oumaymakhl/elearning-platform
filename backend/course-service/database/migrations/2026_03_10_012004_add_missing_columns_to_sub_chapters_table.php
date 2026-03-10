<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('sub_chapters', function (Blueprint $table) {
            $table->unsignedBigInteger('chapter_id')->after('id');
            $table->foreign('chapter_id')->references('id')->on('chapters')->onDelete('cascade');
            $table->string('title')->after('chapter_id');
            $table->text('content')->nullable()->after('title');
            $table->integer('order')->default(0)->after('content');
            $table->boolean('is_lab')->default(false)->after('order');
        });
    }

    public function down()
    {
        Schema::table('sub_chapters', function (Blueprint $table) {
            $table->dropForeign(['chapter_id']);
            $table->dropColumn(['chapter_id', 'title', 'content', 'order', 'is_lab']);
        });
    }
};
