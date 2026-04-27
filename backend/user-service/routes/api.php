<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AdminController;

Route::get('/ping', fn() => response()->json(['status' => 'ok']));

// Publiques
Route::get('/teachers',    [UserController::class, 'teachers']);
Route::get('/students',    [UserController::class, 'students']);
Route::get('/users/{id}',  [UserController::class, 'show']);

// Protégées
Route::middleware('jwt')->group(function () {
    // Recherche d'utilisateurs (accessible aux profs)
    Route::get('/users', [UserController::class, 'search']);
    // Profil personnel
    Route::get('/me',  [UserController::class, 'me']);
    Route::put('/me',  [UserController::class, 'updateMe']);
    Route::post('/me/avatar', [UserController::class, 'uploadAvatar']);

    // Sync inter-services
    Route::post('/users/sync', [UserController::class, 'sync']);

    // Admin - gestion utilisateurs
    Route::get('/admin/stats',              [AdminController::class, 'stats']);
    Route::get('/admin/users',              [AdminController::class, 'users']);
    Route::post('/admin/users',             [AdminController::class, 'createUser']);
    Route::put('/admin/users/{id}',         [AdminController::class, 'updateUser']);
    Route::delete('/admin/users/{id}',      [AdminController::class, 'deleteUser']);
    Route::patch('/admin/users/{id}/toggle',[AdminController::class, 'toggleActive']);
    Route::get('/admin/report',             [AdminController::class, 'globalReport']);
});

// Route interne - récupérer tous les étudiants
Route::get('/internal/students', [UserController::class, 'allStudents']);
Route::post('/internal/sync', [UserController::class, 'sync']);
Route::post('/internal/students-by-ids', [UserController::class, 'studentsByIds']);
