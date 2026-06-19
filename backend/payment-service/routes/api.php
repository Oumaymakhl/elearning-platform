<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PaymeeController;

Route::prefix('payments')->group(function () {
    Route::post('/initiate', [PaymeeController::class, 'initiate']);
    Route::get('/success',   [PaymeeController::class, 'success']);
    Route::get('/',          [PaymeeController::class, 'index']);
});
Route::delete('/internal/courses/{courseId}', [PaymeeController::class, 'destroyForCourse']);
