<?php

namespace Tests\Feature;

use App\Services\BackofficeAuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class BackofficeAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Point the auth directory at the local sqlite test DB and build a
        // stand-in for the external data_log_userv2 table.
        config()->set('backoffice.connection', 'sqlite');
        config()->set('backoffice.table', 'data_log_userv2');

        Schema::create('data_log_userv2', function ($table) {
            $table->id();
            $table->string('employee_code');
            $table->string('pass_jwt')->nullable();
            $table->string('status')->nullable();
            $table->string('email')->nullable();
            $table->string('name_user')->nullable();
        });

        DB::table('data_log_userv2')->insert([
            'employee_code' => 'EMP001',
            'pass_jwt' => hash('sha256', 'secret123'),
            'status' => 'active',
            'email' => 'emp001@example.com',
            'name_user' => 'Employee One',
        ]);
    }

    public function test_login_succeeds_and_returns_tokens(): void
    {
        $response = $this->postJson('/api/backoffice/login', [
            'employee_code' => 'EMP001',
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonPath('status', true)
            ->assertJsonPath('data.user.employee_code', 'EMP001')
            ->assertJsonStructure(['data' => ['access_token', 'refresh_token', 'token_type', 'expires_at', 'refresh_expires_at']]);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $this->postJson('/api/backoffice/login', [
            'employee_code' => 'EMP001',
            'password' => 'wrong',
        ])->assertStatus(401)->assertJsonPath('status', false);
    }

    public function test_login_rejects_inactive_user(): void
    {
        DB::table('data_log_userv2')->where('employee_code', 'EMP001')->update(['status' => 'disabled']);

        $this->postJson('/api/backoffice/login', [
            'employee_code' => 'EMP001',
            'password' => 'secret123',
        ])->assertStatus(401);
    }

    public function test_refresh_token_lasts_24_hours(): void
    {
        $tokens = $this->loginTokens();

        $payload = app(BackofficeAuthService::class)->decodeToken($tokens['refresh_token'], 'refresh');
        $expected = Carbon::now()->addMinutes((int) config('backoffice.refresh_ttl'))->getTimestamp();

        // Within a minute of 24h from now.
        $this->assertNotNull($payload);
        $this->assertLessThanOrEqual(60, abs($payload['exp'] - $expected));
    }

    public function test_refresh_issues_a_new_token_pair(): void
    {
        $tokens = $this->loginTokens();

        $response = $this->postJson('/api/backoffice/refresh', [
            'refresh_token' => $tokens['refresh_token'],
        ])->assertOk()
            ->assertJsonStructure(['data' => ['access_token', 'refresh_token', 'token_type']]);

        // A brand-new pair is returned, distinct from the one just used.
        $this->assertNotSame($tokens['refresh_token'], $response->json('data.refresh_token'));
        $this->assertNotSame($tokens['access_token'], $response->json('data.access_token'));
    }

    public function test_refresh_rejects_an_access_token(): void
    {
        $tokens = $this->loginTokens();

        // An access token must not be accepted where a refresh token is required.
        $this->postJson('/api/backoffice/refresh', [
            'refresh_token' => $tokens['access_token'],
        ])->assertStatus(401);
    }

    public function test_refresh_rejects_a_tampered_token(): void
    {
        $tokens = $this->loginTokens();

        $this->postJson('/api/backoffice/refresh', [
            'refresh_token' => $tokens['refresh_token'].'x',
        ])->assertStatus(401);
    }

    public function test_me_requires_access_token(): void
    {
        $this->getJson('/api/backoffice/me')->assertStatus(401);

        $tokens = $this->loginTokens();

        $this->getJson('/api/backoffice/me', ['Authorization' => "Bearer {$tokens['access_token']}"])
            ->assertOk()
            ->assertJsonPath('user.employee_code', 'EMP001');
    }

    public function test_logout_succeeds(): void
    {
        $tokens = $this->loginTokens();

        // Stateless logout: the endpoint acknowledges, and the client is
        // responsible for discarding its stored tokens.
        $this->postJson('/api/backoffice/logout', [], ['Authorization' => "Bearer {$tokens['access_token']}"])
            ->assertOk()
            ->assertJsonPath('status', true);
    }

    public function test_me_rejects_a_tampered_access_token(): void
    {
        $tokens = $this->loginTokens();

        $this->getJson('/api/backoffice/me', ['Authorization' => "Bearer {$tokens['access_token']}x"])
            ->assertStatus(401);
    }

    public function test_forgot_password_updates_pass_jwt(): void
    {
        $this->postJson('/api/backoffice/forgot-password', [
            'employee_code' => 'EMP001',
            'password' => 'newsecret123',
            'password_confirmation' => 'newsecret123',
        ])->assertOk()->assertJsonPath('status', true);

        // Old password rejected, new password works.
        $this->postJson('/api/backoffice/login', [
            'employee_code' => 'EMP001',
            'password' => 'secret123',
        ])->assertStatus(401);

        $this->postJson('/api/backoffice/login', [
            'employee_code' => 'EMP001',
            'password' => 'newsecret123',
        ])->assertOk();
    }

    public function test_forgot_password_unknown_employee_returns_404(): void
    {
        $this->postJson('/api/backoffice/forgot-password', [
            'employee_code' => 'NOPE',
            'password' => 'newsecret123',
            'password_confirmation' => 'newsecret123',
        ])->assertStatus(404);
    }

    /**
     * @return array{access_token:string,refresh_token:string}
     */
    private function loginTokens(): array
    {
        $data = $this->postJson('/api/backoffice/login', [
            'employee_code' => 'EMP001',
            'password' => 'secret123',
        ])->json('data');

        return [
            'access_token' => $data['access_token'],
            'refresh_token' => $data['refresh_token'],
        ];
    }
}
