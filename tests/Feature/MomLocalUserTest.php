<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MomLocalUserTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('backoffice.connection', 'sqlite');
        config()->set('backoffice.table', 'mom_test_users');
    }

    public function test_created_user_can_sign_in_and_use_mom_writer(): void
    {
        $this->artisan('mom:user', ['employee_code' => 'EMP900', '--password' => 'pass-1234', '--name' => 'ผู้ทดสอบ'])
            ->assertSuccessful();
        $this->assertTrue(Schema::hasTable('mom_test_users'));

        $token = $this->postJson('/api/backoffice/login', ['employee_code' => 'EMP900', 'password' => 'pass-1234'])
            ->assertOk()
            ->assertJsonPath('data.user.name_user', 'ผู้ทดสอบ')
            ->json('data.access_token');

        $this->withToken($token)->getJson('/api/backoffice/moms')->assertOk();
    }

    public function test_password_can_be_changed_and_user_disabled(): void
    {
        $this->artisan('mom:user', ['employee_code' => 'EMP901', '--password' => 'old-pass'])->assertSuccessful();
        $this->artisan('mom:user', ['employee_code' => 'EMP901', '--password' => 'new-pass'])->assertSuccessful();

        $this->postJson('/api/backoffice/login', ['employee_code' => 'EMP901', 'password' => 'old-pass'])->assertStatus(401);
        $this->postJson('/api/backoffice/login', ['employee_code' => 'EMP901', 'password' => 'new-pass'])->assertOk();

        $this->artisan('mom:user', ['employee_code' => 'EMP901', '--disable' => true])->assertSuccessful();
        $this->postJson('/api/backoffice/login', ['employee_code' => 'EMP901', 'password' => 'new-pass'])->assertStatus(401);
    }

    public function test_refuses_to_write_to_the_company_directory(): void
    {
        config()->set('backoffice.connection', 'UserData');

        $this->artisan('mom:user', ['employee_code' => 'EMP902', '--password' => 'x'])->assertFailed();
    }
}
