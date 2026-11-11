<?php

namespace App\Providers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Block the artisan commands that drop tables or delete data
        // (db:wipe, migrate:fresh, migrate:refresh, migrate:reset,
        // migrate:rollback) in every environment, so nobody can wipe the
        // database by accident. The app has no migrations to run anyway.
        DB::prohibitDestructiveCommands();
    }
}
