<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;

// Route de test sans authentification
Route::get("/ping", function () {
    return response()->json(["pong" => true]);
});

// Routes protégées par JWT
Route::middleware("auth:api")->group(function () {
    Route::get("/users", [UserController::class, "index"]);
    Route::get("/users/{id}", [UserController::class, "show"]);
});
