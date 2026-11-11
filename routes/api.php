<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Mom\MomContactController;
use App\Http\Controllers\Api\Mom\MomController;
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

        // MOM Writer
        Route::get('/moms', [MomController::class, 'index']);
        Route::post('/moms', [MomController::class, 'store']);
        Route::get('/moms/{mom}', [MomController::class, 'show'])->whereNumber('mom');
        Route::put('/moms/{mom}', [MomController::class, 'update'])->whereNumber('mom');
        Route::delete('/moms/{mom}', [MomController::class, 'destroy'])->whereNumber('mom');
        Route::post('/moms/{mom}/restore', [MomController::class, 'restore'])->whereNumber('mom');

        Route::get('/mom-contacts', [MomContactController::class, 'index']);
        Route::post('/mom-contacts', [MomContactController::class, 'store']);
        Route::put('/mom-contacts/{contact}', [MomContactController::class, 'update'])->whereNumber('contact');
        Route::delete('/mom-contacts/{contact}', [MomContactController::class, 'destroy'])->whereNumber('contact');
    });
});
