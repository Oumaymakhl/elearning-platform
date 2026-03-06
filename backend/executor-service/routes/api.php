<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ExecuteController;

Route::get('/ping', function () {
    return response()->json(['pong' => true]);
});

// Protégé par JWT
Route::middleware('jwt')->group(function () {
    Route::post('/execute', [ExecuteController::class, 'run']);
});
