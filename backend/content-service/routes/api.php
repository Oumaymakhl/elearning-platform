<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ContentController;

Route::get('/ping', fn() => response()->json(['status' => 'ok']));

// Réservé aux inscrits
Route::middleware(['jwt', 'enrolled'])->group(function () {
    Route::get('/contents',      [ContentController::class, 'index']);
    Route::get('/contents/{id}', [ContentController::class, 'show']);
});

// Protégées JWT — formateur/admin
Route::middleware('jwt')->group(function () {
    Route::post('/contents',         [ContentController::class, 'store']);
    Route::put('/contents/{id}',     [ContentController::class, 'update']);
    Route::delete('/contents/{id}',  [ContentController::class, 'destroy']);
});
