<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ExecuteController;

Route::get('/ping', fn() => response()->json(['pong' => true]));

// Route interne sans JWT (pour appels inter-services)
Route::post('/internal/execute', [ExecuteController::class, 'run']);

// Route publique protégée JWT
Route::middleware('jwt')->group(function () {
    Route::post('/execute', [ExecuteController::class, 'run']);
});
