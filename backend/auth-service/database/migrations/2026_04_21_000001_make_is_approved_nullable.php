<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        DB::statement('ALTER TABLE users MODIFY is_approved TINYINT(1) NULL DEFAULT NULL');
        DB::statement("UPDATE users SET is_approved = NULL WHERE role = 'teacher' AND is_approved = 0");
    }
    public function down(): void {
        DB::statement('ALTER TABLE users MODIFY is_approved TINYINT(1) NOT NULL DEFAULT 0');
        DB::statement("UPDATE users SET is_approved = 0 WHERE role = 'teacher' AND is_approved IS NULL");
    }
};
