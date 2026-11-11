<?php

use Illuminate\Support\Facades\Route;

$projectPrefix = trim((string) config('app.project'), '/');
$apiPrefix = $projectPrefix === '' ? 'api' : "{$projectPrefix}/api";
$base = $projectPrefix === '' ? '' : "/{$projectPrefix}";

Route::middleware('api')
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class])
    ->prefix($apiPrefix)
    ->group(function () {
        require base_path('routes/api.php');
    });

// The whole app is the MOM Writer SPA under /<project>/backoffice/.
// The SPA itself sends signed-out visitors to its login page.
if ($projectPrefix !== '') {
    Route::redirect('/', "{$base}/backoffice/moms");
}

Route::prefix($projectPrefix)->group(function () use ($base) {
    Route::redirect('/', "{$base}/backoffice/moms");
    Route::redirect('/backoffice', "{$base}/backoffice/moms");
    Route::get('/backoffice/{any?}', function () {
        return view('backoffice');
    })->where('any', '.*');
});
