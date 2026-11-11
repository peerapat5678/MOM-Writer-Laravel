<?php

namespace App\Support;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The MOM Writer tables. This app has no migrations: on SQL Server the tables
 * are created once with database/schema.mssql.sql. This class creates the same
 * tables for SQLite (local machines, tests) through `php artisan mom:create-tables`.
 *
 * It only ever creates tables that are missing. It never drops, empties or
 * alters a table, so running it against a database that has data is safe.
 */
class MomSchema
{
    public const TABLES = ['moms', 'mom_contacts'];

    /** @return list<string> the tables that were created */
    public static function createMissing(?string $connection = null): array
    {
        $schema = Schema::connection($connection);
        $sqlsrv = DB::connection($connection)->getDriverName() === 'sqlsrv';
        $created = [];

        if (! $schema->hasTable('moms')) {
            $schema->create('moms', function (Blueprint $t) {
                $t->id();
                $t->string('title', 255);
                $t->date('meeting_date')->nullable();
                $t->string('location', 255)->nullable();
                $t->string('recorder', 255)->nullable();
                $t->unsignedInteger('open_actions')->default(0);
                $t->longText('search_text')->nullable();
                $t->longText('data');
                $t->unsignedInteger('version')->default(1);
                $t->string('created_by', 50)->nullable();   // employee_code
                $t->string('updated_by', 50)->nullable();   // employee_code
                $t->timestamps();
                $t->dateTime('deleted_at')->nullable();
                $t->index(['deleted_at', 'meeting_date']);
            });
            $created[] = 'moms';
        }

        if (! $schema->hasTable('mom_contacts')) {
            $schema->create('mom_contacts', function (Blueprint $t) use ($sqlsrv) {
                $t->id();
                $t->string('name', 255);
                $t->string('email', 255)->nullable();
                $t->string('role', 255)->nullable();
                $t->timestamps();
                $t->index('name');
                if (! $sqlsrv) {
                    $t->unique('email');
                }
            });
            // SQL Server treats NULLs as equal in a unique index: unique emails,
            // but many contacts may have none.
            if ($sqlsrv) {
                DB::connection($connection)->statement(
                    'CREATE UNIQUE INDEX mom_contacts_email_unique ON mom_contacts (email) WHERE email IS NOT NULL'
                );
            }
            $created[] = 'mom_contacts';
        }

        return $created;
    }
}
