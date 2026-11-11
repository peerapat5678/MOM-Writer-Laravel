<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Create or update a login in a local user directory, for running MOM Writer
 * without access to the company UserData server (local machines, demos, tests).
 *
 *   php artisan mom:user EMP001 --name="สมชาย ใจดี" --email=somchai@example.com
 *
 * Point BACKOFFICE_AUTH_CONNECTION at the app's own database first (for example
 * "sqlite" or "sqlsrv"). The command refuses to write to the UserData connection.
 */
class MomLocalUser extends Command
{
    protected $signature = 'mom:user
        {employee_code : รหัสพนักงานที่ใช้ login}
        {--password= : รหัสผ่าน (ถ้าไม่ใส่ จะถาม)}
        {--name= : ชื่อที่แสดงและใช้ลงท้ายเอกสาร}
        {--email= : อีเมล}
        {--disable : ปิดการใช้งาน login นี้}';

    protected $description = 'Create or update a MOM Writer login in a local user directory';

    public function handle(): int
    {
        $connection = (string) config('backoffice.connection');
        $table = (string) config('backoffice.table');
        $col = config('backoffice.columns');

        if (strcasecmp($connection, 'UserData') === 0) {
            $this->error('BACKOFFICE_AUTH_CONNECTION ยังชี้ไปที่ UserData (ฐานผู้ใช้ของบริษัท) คำสั่งนี้จะไม่แก้ข้อมูลที่นั่น');
            $this->line('สำหรับเครื่อง local ให้ตั้ง BACKOFFICE_AUTH_CONNECTION เป็น connection ของแอปเอง เช่น sqlite หรือ sqlsrv แล้วรันใหม่');

            return self::FAILURE;
        }

        $code = trim((string) $this->argument('employee_code'));
        if ($code === '' || mb_strlen($code) > 50) {
            $this->error('รหัสพนักงานต้องมี 1–50 ตัวอักษร');

            return self::FAILURE;
        }

        $schema = Schema::connection($connection);
        if (! $schema->hasTable($table)) {
            $schema->create($table, function (Blueprint $t) use ($col) {
                $t->id();
                $t->string($col['employee_code'], 50)->unique();
                $t->string($col['password'], 64);
                $t->string($col['status'], 20)->default('active');
                $t->string('name_user', 255)->nullable();
                $t->string('email', 255)->nullable();
                $t->string('position', 255)->nullable();
            });
            $this->info("สร้างตาราง {$table} บน connection {$connection} แล้ว");
        }

        $users = DB::connection($connection)->table($table);
        $exists = (clone $users)->where($col['employee_code'], $code)->exists();

        $password = $this->option('password');
        if ($password === null && ! $this->option('disable')) {
            $password = $this->secret('รหัสผ่าน');
        }
        if (! $exists && ($password === null || $password === '')) {
            $this->error('ผู้ใช้ใหม่ต้องมีรหัสผ่าน');

            return self::FAILURE;
        }

        $row = [];
        if ($password !== null && $password !== '') {
            $row[$col['password']] = hash('sha256', (string) $password);
        }
        $active = config('backoffice.active_status') ?? 'active';
        $row[$col['status']] = $this->option('disable') ? 'inactive' : $active;
        foreach (['name' => 'name_user', 'email' => 'email'] as $opt => $column) {
            if ($this->option($opt) !== null) {
                $row[$column] = $this->option($opt);
            }
        }

        if ($exists) {
            (clone $users)->where($col['employee_code'], $code)->update($row);
            $this->info("อัปเดตผู้ใช้ {$code} แล้ว");
        } else {
            $users->insert($row + [$col['employee_code'] => $code]);
            $this->info("เพิ่มผู้ใช้ {$code} แล้ว");
        }

        return self::SUCCESS;
    }
}
