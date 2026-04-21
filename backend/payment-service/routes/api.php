<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PaymeeController;

Route::get("/health", function () {
    return response()->json(["status" => "ok"]);
});

Route::post("/payments/initiate", [PaymeeController::class, "initiate"]);
Route::post("/payments/webhook",  [PaymeeController::class, "webhook"]);
Route::get("/payments/success",   [PaymeeController::class, "success"]);
Route::get("/payments/cancel",    [PaymeeController::class, "cancel"]);
Route::get("/payments",           [PaymeeController::class, "index"]);
