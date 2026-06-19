<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            if (!Schema::hasColumn('quizzes', 'chapter_id')) $table->unsignedBigInteger('chapter_id')->nullable();
            if (!Schema::hasColumn('quizzes', 'course_id')) $table->unsignedBigInteger('course_id')->nullable();
            if (!Schema::hasColumn('quizzes', 'time_limit')) $table->unsignedInteger('time_limit')->nullable();
        });

        DB::statement('DELETE duplicate FROM quizzes duplicate INNER JOIN quizzes keep_row ON duplicate.chapter_id = keep_row.chapter_id AND duplicate.id > keep_row.id WHERE duplicate.chapter_id IS NOT NULL');
        Schema::table('quizzes', function (Blueprint $table) {
            $table->unique('chapter_id', 'quizzes_chapter_unique');
        });
    }

    public function down(): void
    {
        Schema::table('quizzes', fn (Blueprint $table) => $table->dropUnique('quizzes_chapter_unique'));
    }
};
