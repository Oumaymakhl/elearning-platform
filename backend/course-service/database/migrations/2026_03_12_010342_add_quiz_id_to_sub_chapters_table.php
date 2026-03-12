<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('sub_chapters', function (Blueprint $table) {
            $table->unsignedBigInteger('quiz_id')->nullable()->after('is_lab');
            $table->unsignedInteger('passing_score')->default(70)->after('quiz_id');
        });
    }
    public function down(): void {
        Schema::table('sub_chapters', function (Blueprint $table) {
            $table->dropColumn(['quiz_id', 'passing_score']);
        });
    }
};
