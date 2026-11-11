<?php

use Illuminate\Support\Facades\Route;

$projectPrefix = trim((string) config('app.project'), '/');
$apiPrefix = $projectPrefix === '' ? 'api' : "{$projectPrefix}/api";

Route::middleware('api')
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class])
    ->prefix($apiPrefix)
    ->group(function () {
    require base_path('routes/api.php');
});

if ($projectPrefix !== '') {
    Route::redirect('/', "/{$projectPrefix}");

    Route::prefix($projectPrefix)->group(function () use ($projectPrefix) {
        Route::get('/', function () {
            return view('welcome');
        });

        Route::redirect('/backoffice', "/{$projectPrefix}/backoffice/login");
        Route::get('/backoffice/{any?}', function () {
            return view('backoffice');
        })->where('any', '.*');
    });
} else {
    Route::get('/', function () {
        return view('welcome');
    });

    Route::redirect('/backoffice', '/backoffice/login');
    Route::get('/backoffice/{any?}', function () {
        return view('backoffice');
    })->where('any', '.*');
}
