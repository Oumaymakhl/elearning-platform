<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ForumController;

// Toutes les routes forum réservées aux inscrits
Route::middleware(['jwt', 'enrolled'])->group(function () {
    Route::get('/forum/courses/{courseId}/posts',    [ForumController::class, 'getPosts']);
    Route::post('/forum/courses/{courseId}/posts',   [ForumController::class, 'createPost']);
    Route::post('/forum/posts/{postId}/replies',     [ForumController::class, 'createReply']);
    Route::put('/forum/posts/{postId}',              [ForumController::class, 'updatePost']);
    Route::delete('/forum/posts/{postId}',           [ForumController::class, 'deletePost']);
    Route::delete('/forum/replies/{replyId}',        [ForumController::class, 'deleteReply']);
});
