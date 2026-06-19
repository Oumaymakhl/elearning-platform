<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement('DELETE enrollment FROM enrollments enrollment LEFT JOIN courses course_row ON course_row.id = enrollment.course_id WHERE course_row.id IS NULL');
        DB::statement('DELETE duplicate FROM enrollments duplicate INNER JOIN enrollments keep_row ON duplicate.user_id = keep_row.user_id AND duplicate.course_id = keep_row.course_id AND duplicate.id > keep_row.id');
        Schema::table('enrollments', function (Blueprint $table) {
            $table->unique(['user_id', 'course_id'], 'enrollments_user_course_unique');
            $table->foreign('course_id')->references('id')->on('courses')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropUnique('enrollments_user_course_unique');
        });
    }
};
