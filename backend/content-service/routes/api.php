<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ContentController;

Route::get("/ping", function () {
    return response()->json(["pong" => true]);
});

Route::middleware("auth:api")->group(function () {
    Route::apiResource("contents", ContentController::class);
});
