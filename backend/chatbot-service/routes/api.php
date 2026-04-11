<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\QuizGeneratorController;

Route::get('/ping',  [ChatController::class, 'ping']);
Route::post('/chat', [ChatController::class, 'chat']);

Route::middleware('jwt')->group(function () {
    Route::get('/chat/conversations',             [ChatController::class, 'conversations']);
    Route::get('/chat/history/{conversationId}',  [ChatController::class, 'history']);
});

Route::post('/generate-quiz', [QuizGeneratorController::class, 'generate']);
