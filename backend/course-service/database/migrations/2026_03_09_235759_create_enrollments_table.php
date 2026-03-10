<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->unsignedBigInteger('current_sub_chapter_id')->nullable()->after('course_id');
            $table->decimal('progress', 5, 2)->default(0)->after('current_sub_chapter_id');
            $table->timestamp('enrolled_at')->useCurrent()->after('progress');
        });
    }
    public function down(): void {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn(['current_sub_chapter_id', 'progress', 'enrolled_at']);
        });
    }
};
