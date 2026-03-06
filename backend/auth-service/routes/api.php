<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// Route de santé (sans données sensibles)
Route::get("/health", function () {
    return response()->json([
        "status"    => "healthy",
        "service"   => "auth-service",
        "timestamp" => now()->toISOString(),
    ]);
});

// Routes d'authentification publiques
Route::post("/register", [AuthController::class, "register"]);
Route::post("/login",    [AuthController::class, "login"]);

// Routes protégées (nécessitent un token JWT)
Route::middleware("auth:api")->group(function () {
    Route::post("/logout",  [AuthController::class, "logout"]);
    Route::post("/refresh", [AuthController::class, "refresh"]);
    Route::get("/me",       [AuthController::class, "me"]);
});
