<?php

namespace App\Console\Commands;

use App\Support\MomSchema;
use Illuminate\Console\Command;

/**
 * Create the MOM Writer tables that do not exist yet. Never drops or changes
 * an existing table. Meant for SQLite on local machines; on SQL Server the
 * usual way is database/schema.mssql.sql, but this works there too.
 */
class MomCreateTables extends Command
{
    protected $signature = 'mom:create-tables';

    protected $description = 'Create the MOM Writer tables that are missing (never drops or alters anything)';

    public function handle(): int
    {
        $created = MomSchema::createMissing();
        $connection = config('database.default');

        if ($created === []) {
            $this->info("ตาราง ".implode(', ', MomSchema::TABLES)." มีอยู่แล้วบน {$connection} ไม่ได้แก้ไขอะไร");
        } else {
            $this->info('สร้างตาราง '.implode(', ', $created)." บน {$connection} แล้ว");
        }

        return self::SUCCESS;
    }
}
