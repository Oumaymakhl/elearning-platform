<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PaymeeController;

Route::prefix('payments')->group(function () {
    Route::post('/initiate', [PaymeeController::class, 'initiate']);
    Route::get('/success',   [PaymeeController::class, 'success']);
    Route::get('/',          function() {
        $payments = \App\Models\Payment::all();
        return response()->json(['success' => true, 'data' => $payments]);
    });
});
