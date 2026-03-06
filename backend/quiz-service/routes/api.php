<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\AttemptController;

Route::get('/ping', function () {
    return response()->json(['pong' => true]);
});

Route::middleware('jwt')->group(function () {
    Route::apiResource('quizzes', QuizController::class);
    Route::get('/quizzes/{quiz}/questions', [QuestionController::class, 'index']);
    Route::get('/quizzes/{quiz}/questions/{question}', [QuestionController::class, 'show']);
    Route::post('/quizzes/{quiz}/questions', [QuestionController::class, 'store']);
    Route::put('/quizzes/{quiz}/questions/{question}', [QuestionController::class, 'update']);
    Route::delete('/quizzes/{quiz}/questions/{question}', [QuestionController::class, 'destroy']);

    Route::post('/quizzes/{quiz}/attempt', [AttemptController::class, 'store']);
    Route::post('/attempts/{attempt}/submit', [AttemptController::class, 'submit']);
    Route::get('/attempts/{attempt}', [AttemptController::class, 'show']);
});
