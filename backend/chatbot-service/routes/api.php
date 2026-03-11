<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ChatController;

Route::get('/ping', [ChatController::class, 'ping']);
Route::post('/chat', [ChatController::class, 'chat']);
