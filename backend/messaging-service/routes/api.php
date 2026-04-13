<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MessagingController;

Route::get('/ping', fn() => response()->json(['status' => 'ok']));
Route::get('/messaging/conversations',                      [MessagingController::class, 'conversations']);
Route::post('/messaging/conversations',                     [MessagingController::class, 'startConversation']);
Route::get('/messaging/conversations/{id}/messages',        [MessagingController::class, 'messages']);
Route::post('/messaging/conversations/{id}/messages',       [MessagingController::class, 'sendMessage']);
Route::get('/messaging/conversations/{id}/stream',          [MessagingController::class, 'stream']);
Route::post('/messaging/upload',                          [MessagingController::class, 'uploadFile']);
Route::delete('/messaging/conversations/{id}',              [MessagingController::class, 'deleteConversation']);
Route::get('/messaging/unread-count',                       [MessagingController::class, 'unreadCount']);
