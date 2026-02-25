<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// Routes publiques
Route::get("/health", function() {
    return response()->json([
        "status" => "healthy",
        "service" => "auth-service",
        "database" => DB::connection()->getDatabaseName(),
        "timestamp" => now()->toISOString()
    ]);
});

Route::get("/env", function() {
    return response()->json([
        "app_env" => env("APP_ENV"),
        "app_debug" => env("APP_DEBUG"),
        "db_host" => env("DB_HOST"),
        "db_database" => env("DB_DATABASE"),
        "jwt_secret_set" => !empty(env("JWT_SECRET"))
    ]);
});

// Routes d'authentification
Route::post("/register", [AuthController::class, "register"]);
Route::post("/login", [AuthController::class, "login"]);

// Routes protégées (nécessitent un token JWT)
Route::middleware("auth:api")->group(function () {
    Route::post("/logout", [AuthController::class, "logout"]);
    Route::post("/refresh", [AuthController::class, "refresh"]);
    Route::get("/me", [AuthController::class, "me"]);
});
