<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('contents', 'sub_chapter_id')) {
            return;
        }

        Schema::table('contents', function (Blueprint $table) {
            $table->unsignedBigInteger('sub_chapter_id')->nullable()->after('course_id');
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('contents', 'sub_chapter_id')) {
            return;
        }

        Schema::table('contents', function (Blueprint $table) {
            $table->dropColumn('sub_chapter_id');
        });
    }
};
