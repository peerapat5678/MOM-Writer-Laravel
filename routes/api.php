<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// Legacy alias kept for backward compatibility.
Route::post('/login', [AuthController::class, 'login']);

Route::prefix('backoffice')->group(function () {
    // Public
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);

    // Protected by the opaque access token
    Route::middleware('backoffice.auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});
