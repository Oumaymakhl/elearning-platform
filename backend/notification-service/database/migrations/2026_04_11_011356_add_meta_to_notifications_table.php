<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium')->after('type');
            $table->string('icon', 20)->nullable()->after('priority');
            $table->string('action_url', 500)->nullable()->after('icon');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['priority', 'icon', 'action_url']);
        });
    }
};
