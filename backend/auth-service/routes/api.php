<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::get('/ping', fn() => response()->json(['status' => 'ok']));

Route::post('/register',     [AuthController::class, 'register']);
Route::post('/login',        [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password',  [AuthController::class, 'resetPassword']);
Route::post('/verify-reset-token', [AuthController::class, 'verifyResetToken']);
Route::get('/verify-email',  [AuthController::class, 'verifyEmail']);
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);

Route::middleware('auth:api')->group(function () {
    Route::post('/logout',         [AuthController::class, 'logout']);
    Route::post('/refresh',        [AuthController::class, 'refresh']);
    Route::get('/me',              [AuthController::class, 'me']);
    Route::get('/users',           [AuthController::class, 'users']);
    Route::put('/users/{id}/role', [AuthController::class, 'updateRole']);
});
Route::get('/teachers', [AuthController::class, 'teachers']);
Route::get('/students', [AuthController::class, 'students']);
