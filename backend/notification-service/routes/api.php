<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NotificationController;

Route::get('/ping', fn() => response()->json(['status' => 'ok']));

// Route interne (appelée par les autres services sans JWT)
Route::post('/internal/send', [NotificationController::class, 'send']);

// Protégées
Route::middleware('jwt')->group(function () {
    Route::get('/notifications',              [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::get('/notifications/stream', [NotificationController::class, 'stream']);
    Route::post('/notifications/read-all',    [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/{id}/read',   [NotificationController::class, 'markAsRead']);
});
// SSE stream (ajouté pour temps réel)
