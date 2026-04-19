<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::post('/login', [AuthController::class, 'login']);
Route::delete('/users/{id}', [AuthController::class, 'deleteUser']);
Route::post('/register', [AuthController::class, 'register']);
Route::get('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/verify-reset-token', [AuthController::class, 'verifyResetToken']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/users', [AuthController::class, 'users']);
    Route::put('/users/{id}/role', [AuthController::class, 'updateRole']);

    Route::get('/teachers/pending', [AuthController::class, 'pendingTeachers']);
    Route::post('/teachers/{id}/approve', [AuthController::class, 'approveTeacher']);
    Route::get('/teachers/{id}/cv', [AuthController::class, 'getCv']);
});
