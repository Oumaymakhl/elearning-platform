<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('sub_chapters', function (Blueprint $table) {
            $table->unsignedBigInteger('exercise_id')->nullable()->after('quiz_id');
        });
    }
    public function down(): void {
        Schema::table('sub_chapters', function (Blueprint $table) {
            $table->dropColumn('exercise_id');
        });
    }
};
