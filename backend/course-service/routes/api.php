<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\ChapterController;
use App\Http\Controllers\SubChapterController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\ExerciseController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\RatingController;
use App\Http\Controllers\AnalyticsController;

Route::get('/ping', fn() => response()->json(['status' => 'ok']));
// Route interne pour inscription depuis payment-service
Route::post('/internal/enroll', function(\Illuminate\Http\Request $request) {
    \App\Http\Controllers\EnrollmentController::enrollInternal($request->user_id, $request->course_id);
    return response()->json(['success' => true]);
});

// Publiques
Route::get('/courses',            [CourseController::class, 'index']);
Route::get('/courses/{id}',       [CourseController::class, 'show']);
Route::get('/courses/{courseId}/ratings', [RatingController::class, 'stats']);
Route::get('/exercises',          [ExerciseController::class, 'index']);
Route::get('/exercises/{id}',     [ExerciseController::class, 'show']);

// Réservé aux inscrits
Route::middleware(['jwt', 'enrolled'])->group(function () {
    Route::get('/courses/{courseId}/chapters',                                      [ChapterController::class, 'index']);
    Route::get('/courses/{courseId}/chapters/{id}',                                 [ChapterController::class, 'show']);
    Route::get('/courses/{courseId}/chapters/{chapterId}/subchapters',              [SubChapterController::class, 'index']);
    Route::get('/courses/{courseId}/chapters/{chapterId}/subchapters/{id}',         [SubChapterController::class, 'show']);
});

// Protégées JWT
Route::middleware('jwt')->group(function () {
    Route::post('/courses',        [CourseController::class, 'store']);
    Route::put('/courses/{id}',    [CourseController::class, 'update']);
    Route::delete('/courses/{id}', [CourseController::class, 'destroy']);

    Route::post('/courses/{courseId}/chapters',              [ChapterController::class, 'store']);
    Route::put('/courses/{courseId}/chapters/{id}',          [ChapterController::class, 'update']);
    Route::delete('/courses/{courseId}/chapters/{id}',       [ChapterController::class, 'destroy']);

    Route::post('/courses/{courseId}/chapters/{chapterId}/subchapters',              [SubChapterController::class, 'store']);
    Route::put('/courses/{courseId}/chapters/{chapterId}/subchapters/{id}',          [SubChapterController::class, 'update']);
    Route::delete('/courses/{courseId}/chapters/{chapterId}/subchapters/{id}',       [SubChapterController::class, 'destroy']);

    Route::get('/my-courses',                        [EnrollmentController::class, 'myCourses']);
    Route::post('/courses/{courseId}/enroll',        [EnrollmentController::class, 'enroll']);
    Route::delete('/courses/{courseId}/enroll',      [EnrollmentController::class, 'unenroll']);
    Route::get('/courses/{courseId}/students',       [EnrollmentController::class, 'courseStudents']);

    Route::get('/courses/{courseId}/progress',       [ProgressController::class, 'show']);
    Route::post('/courses/{courseId}/progress',      [ProgressController::class, 'update']);

    Route::post('/exercises',                        [ExerciseController::class, 'store']);
    Route::put('/exercises/{id}',                    [ExerciseController::class, 'update']);
    Route::delete('/exercises/{id}',                 [ExerciseController::class, 'destroy']);

    Route::post('/exercises/{exerciseId}/questions',                                    [ExerciseController::class, 'storeQuestion']);
    Route::put('/exercises/{exerciseId}/questions/{questionId}',                        [ExerciseController::class, 'updateQuestion']);
    Route::delete('/exercises/{exerciseId}/questions/{questionId}',                     [ExerciseController::class, 'destroyQuestion']);

    Route::post('/exercises/{exerciseId}/questions/{questionId}/test-cases',            [ExerciseController::class, 'storeTestCase']);
    Route::delete('/exercises/{exerciseId}/questions/{questionId}/test-cases/{testCaseId}', [ExerciseController::class, 'destroyTestCase']);

    Route::post('/exercises/{exerciseId}/questions/{questionId}/submit',                [ExerciseController::class, 'submit']);
    Route::get('/exercises/{exerciseId}/results',       [ExerciseController::class, 'results']);
    Route::get('/exercises/{exerciseId}/participation', [ExerciseController::class, 'participation']);
    Route::get('/exercises/{exerciseId}/my-submissions',[ExerciseController::class, 'mySubmissions']);

    Route::post('/courses/{courseId}/ratings',       [RatingController::class, 'store']);
    Route::get('/courses/{courseId}/ratings/mine',   [RatingController::class, 'myRating']);
    Route::delete('/courses/{courseId}/ratings',     [RatingController::class, 'destroy']);

    Route::get('/courses/{courseId}/visited-subs', function($courseId) {
        $userId = request()->auth_user_id;
        $ids = \DB::table('visited_sub_chapters')
            ->where('user_id', $userId)
            ->where('course_id', $courseId)
            ->pluck('sub_chapter_id');
        return response()->json($ids);
    });

    Route::post('/courses/{courseId}/visited-subs/{subId}', function($courseId, $subId) {
        $userId = request()->auth_user_id;
        \DB::table('visited_sub_chapters')->insertOrIgnore([
            'user_id'        => $userId,
            'course_id'      => $courseId,
            'sub_chapter_id' => $subId
        ]);
        return response()->json(['ok' => true]);
    });

    Route::get('/certificates',                          [CertificateController::class, 'myCertificates']);
    Route::get('/courses/{courseId}/certificate',        [CertificateController::class, 'get']);
    Route::post('/courses/{courseId}/certificate/check', [CertificateController::class, 'check']);

    Route::get('/analytics/teacher',             [AnalyticsController::class, 'teacherStats']);
    Route::get('/analytics/courses/{courseId}',  [AnalyticsController::class, 'courseStats']);
});
