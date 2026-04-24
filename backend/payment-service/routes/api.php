<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StripeController;

Route::prefix('payments')->group(function () {
    Route::post('/initiate', [StripeController::class, 'initiate']);
    Route::get('/success',   [StripeController::class, 'success']);
    Route::get('/',          function() {
        $payments = \App\Models\Payment::all();
        return response()->json(['success' => true, 'data' => $payments]);
    });
});
