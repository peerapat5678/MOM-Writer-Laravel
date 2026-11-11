<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MomSchemaTest extends TestCase
{
    public function test_create_tables_only_adds_what_is_missing_and_keeps_data(): void
    {
        $this->artisan('mom:create-tables')->assertSuccessful();
        $this->assertTrue(Schema::hasTable('moms'));
        $this->assertTrue(Schema::hasTable('mom_contacts'));

        DB::table('mom_contacts')->insert(['name' => 'คุณเอ', 'email' => 'a@example.com']);

        $this->artisan('mom:create-tables')->assertSuccessful();
        $this->assertSame(1, DB::table('mom_contacts')->count());
    }

    public function test_commands_that_drop_tables_are_blocked(): void
    {
        $this->artisan('mom:create-tables')->assertSuccessful();
        DB::table('mom_contacts')->insert(['name' => 'คุณเอ']);

        foreach (['db:wipe', 'migrate:fresh', 'migrate:refresh', 'migrate:reset', 'migrate:rollback'] as $command) {
            $this->artisan($command, ['--force' => true])->assertFailed();
        }

        $this->assertSame(1, DB::table('mom_contacts')->count());
    }
}
