<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    /**
     * Tests create and drop tables, so they may only ever run against a
     * throwaway in-memory SQLite database (set in phpunit.xml). If the config
     * points anywhere else (for example a cached config with the real
     * SQL Server), stop before any test touches it.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $default = config('database.default');
        if ($default !== 'sqlite' || config("database.connections.{$default}.database") !== ':memory:') {
            throw new RuntimeException(
                'Tests must run on SQLite :memory:, but the database is "'.$default.'". '
                .'Run "php artisan config:clear" and check phpunit.xml. No test was run.'
            );
        }
    }
}
