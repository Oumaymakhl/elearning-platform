<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\OptionController;
use App\Http\Controllers\AttemptController;
use App\Http\Controllers\QuizResultsController;

Route::get('/ping', fn() => response()->json(['status' => 'ok']));
Route::get('/quiz-stats', [QuizResultsController::class, 'globalStats']);

// Publiques
Route::get('/quizzes', [QuizController::class, 'index']);
Route::get('/quizzes/{id}', [QuizController::class, 'show']);
Route::get('/chapters/{chapterId}/quizzes', [QuizController::class, 'byChapter']);
Route::get('/quizzes/{quizId}/questions', [QuestionController::class, 'index']);
Route::get('/quizzes/{quizId}/questions/{id}', [QuestionController::class, 'show']);

// Protégées
Route::middleware('jwt')->group(function () {
    // Quiz CRUD
    Route::post('/quizzes', [QuizController::class, 'store']);
    Route::put('/quizzes/{id}', [QuizController::class, 'update']);
    Route::delete('/quizzes/{id}', [QuizController::class, 'destroy']);

    // Questions
    Route::post('/quizzes/{quizId}/questions', [QuestionController::class, 'store']);
    Route::put('/quizzes/{quizId}/questions/{id}', [QuestionController::class, 'update']);
    Route::delete('/quizzes/{quizId}/questions/{id}', [QuestionController::class, 'destroy']);

    // Options
    Route::get('/quizzes/{quizId}/questions/{questionId}/options', [OptionController::class, 'index']);
    Route::post('/quizzes/{quizId}/questions/{questionId}/options', [OptionController::class, 'store']);
    Route::put('/quizzes/{quizId}/questions/{questionId}/options/{id}', [OptionController::class, 'update']);
    Route::delete('/quizzes/{quizId}/questions/{questionId}/options/{id}', [OptionController::class, 'destroy']);

    // Tentatives
    Route::post('/quizzes/{quizId}/attempts', [AttemptController::class, 'start']);
    Route::post('/quizzes/{quizId}/attempts/{attemptId}/submit', [AttemptController::class, 'submit']);
    Route::get('/quizzes/{quizId}/attempts/mine', [AttemptController::class, 'myAttempts']);
    Route::get('/quizzes/{quizId}/attempts', [AttemptController::class, 'allAttempts']);

    // Résultats formateur
    Route::get('/quizzes/{quizId}/results', [QuizResultsController::class, 'quizResults']);

    // Stats admin
    Route::get('/stats', [QuizResultsController::class, 'globalStats']);
});
