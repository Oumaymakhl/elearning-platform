<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\ProgressController;

// Route de test publique
Route::get('/ping', function () {
    return response()->json(['pong' => true]);
});

// Routes protégées par JWT
Route::middleware('auth:api')->group(function () {
    // Cours
    Route::apiResource('courses', CourseController::class);
    // Leçons (imbriquées)
    Route::get('/courses/{course}/lessons', [LessonController::class, 'index']);
    Route::get('/courses/{course}/lessons/{lesson}', [LessonController::class, 'show']);
    Route::post('/courses/{course}/lessons', [LessonController::class, 'store']);
    Route::put('/courses/{course}/lessons/{lesson}', [LessonController::class, 'update']);
    Route::delete('/courses/{course}/lessons/{lesson}', [LessonController::class, 'destroy']);
    // Inscriptions
    Route::post('/courses/{course}/enroll', [EnrollmentController::class, 'store']);
    Route::get('/my-courses', [EnrollmentController::class, 'myCourses']);
    // Progression
    Route::post('/lessons/{lesson}/complete', [ProgressController::class, 'complete']);
});
