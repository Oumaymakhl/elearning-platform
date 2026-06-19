<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'auth_id')) $table->unsignedBigInteger('auth_id')->nullable()->unique();
            if (!Schema::hasColumn('users', 'role')) $table->string('role')->default('student');
            if (!Schema::hasColumn('users', 'bio')) $table->text('bio')->nullable();
            if (!Schema::hasColumn('users', 'phone')) $table->string('phone')->nullable();
            if (!Schema::hasColumn('users', 'address')) $table->string('address')->nullable();
            if (!Schema::hasColumn('users', 'avatar')) $table->string('avatar')->nullable();
            if (!Schema::hasColumn('users', 'speciality')) $table->string('speciality')->nullable();
            if (!Schema::hasColumn('users', 'is_active')) $table->boolean('is_active')->default(true);
        });
    }

    public function down(): void
    {
        // These columns may predate this migration on deployed databases.
    }
};
