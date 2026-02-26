<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ExecuteController;

Route::post('/execute', [ExecuteController::class, 'run']);
