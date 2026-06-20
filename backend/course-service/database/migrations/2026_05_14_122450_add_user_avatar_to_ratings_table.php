<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (Schema::hasColumn('ratings', 'user_avatar')) {
            return;
        }

        Schema::table('ratings', function (Blueprint $table) {
            $table->string('user_avatar')->nullable()->after('user_name');
        });
    }
    public function down(): void {
        if (!Schema::hasColumn('ratings', 'user_avatar')) {
            return;
        }

        Schema::table('ratings', function (Blueprint $table) {
            $table->dropColumn('user_avatar');
        });
    }
};
