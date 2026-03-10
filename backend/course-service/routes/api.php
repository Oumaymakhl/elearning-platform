<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\ChapterController;
use App\Http\Controllers\SubChapterController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\ExerciseController;

Route::get('/ping', fn() => response()->json(['status' => 'ok']));

// Publiques
Route::get('/courses', [CourseController::class, 'index']);
Route::get('/courses/{id}', [CourseController::class, 'show']);
Route::get('/courses/{courseId}/chapters', [ChapterController::class, 'index']);
Route::get('/courses/{courseId}/chapters/{id}', [ChapterController::class, 'show']);
Route::get('/courses/{courseId}/chapters/{chapterId}/subchapters', [SubChapterController::class, 'index']);
Route::get('/courses/{courseId}/chapters/{chapterId}/subchapters/{id}', [SubChapterController::class, 'show']);
Route::get('/exercises', [ExerciseController::class, 'index']);
Route::get('/exercises/{id}', [ExerciseController::class, 'show']);

// Protégées
Route::middleware('jwt')->group(function () {
    // Cours
    Route::post('/courses', [CourseController::class, 'store']);
    Route::put('/courses/{id}', [CourseController::class, 'update']);
    Route::delete('/courses/{id}', [CourseController::class, 'destroy']);

    // Chapitres
    Route::post('/courses/{courseId}/chapters', [ChapterController::class, 'store']);
    Route::put('/courses/{courseId}/chapters/{id}', [ChapterController::class, 'update']);
    Route::delete('/courses/{courseId}/chapters/{id}', [ChapterController::class, 'destroy']);

    // Sous-chapitres
    Route::post('/courses/{courseId}/chapters/{chapterId}/subchapters', [SubChapterController::class, 'store']);
    Route::put('/courses/{courseId}/chapters/{chapterId}/subchapters/{id}', [SubChapterController::class, 'update']);
    Route::delete('/courses/{courseId}/chapters/{chapterId}/subchapters/{id}', [SubChapterController::class, 'destroy']);

    // Inscriptions
    Route::get('/my-courses', [EnrollmentController::class, 'myCourses']);
    Route::post('/courses/{courseId}/enroll', [EnrollmentController::class, 'enroll']);
    Route::delete('/courses/{courseId}/enroll', [EnrollmentController::class, 'unenroll']);
    Route::get('/courses/{courseId}/students', [EnrollmentController::class, 'courseStudents']);

    // Progression
    Route::get('/courses/{courseId}/progress', [ProgressController::class, 'show']);
    Route::post('/courses/{courseId}/progress', [ProgressController::class, 'update']);

    // Exercices TD (formateur)
    Route::post('/exercises', [ExerciseController::class, 'store']);
    Route::put('/exercises/{id}', [ExerciseController::class, 'update']);
    Route::delete('/exercises/{id}', [ExerciseController::class, 'destroy']);

    // Questions TD
    Route::post('/exercises/{exerciseId}/questions', [ExerciseController::class, 'storeQuestion']);
    Route::put('/exercises/{exerciseId}/questions/{questionId}', [ExerciseController::class, 'updateQuestion']);
    Route::delete('/exercises/{exerciseId}/questions/{questionId}', [ExerciseController::class, 'destroyQuestion']);

    // Test cases
    Route::post('/exercises/{exerciseId}/questions/{questionId}/test-cases', [ExerciseController::class, 'storeTestCase']);
    Route::delete('/exercises/{exerciseId}/questions/{questionId}/test-cases/{testCaseId}', [ExerciseController::class, 'destroyTestCase']);

    // Soumission & évaluation
    Route::post('/exercises/{exerciseId}/questions/{questionId}/submit', [ExerciseController::class, 'submit']);

    // Résultats
    Route::get('/exercises/{exerciseId}/results', [ExerciseController::class, 'results']);
    Route::get('/exercises/{exerciseId}/participation', [ExerciseController::class, 'participation']);
    Route::get('/exercises/{exerciseId}/my-submissions', [ExerciseController::class, 'mySubmissions']);
});
