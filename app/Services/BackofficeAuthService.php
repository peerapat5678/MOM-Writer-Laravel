<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Handles authentication against the external UserData directory
 * (config('backoffice.table'), default data_log_userv2) and issues stateless,
 * HMAC-signed JWT access / refresh tokens. No server-side token store is kept:
 * tokens are self-contained and verified by their signature and expiry alone.
 */
class BackofficeAuthService
{
    private string $connection;

    private string $table;

    /** @var array<string,string> */
    private array $columns;

    private ?string $activeStatus;

    public function __construct()
    {
        $this->connection = config('backoffice.connection');
        $this->table = config('backoffice.table');
        $this->columns = config('backoffice.columns');
        $this->activeStatus = config('backoffice.active_status');
    }

    /**
     * Look up an active user and verify the SHA-256 password hash.
     * Returns the raw user record on success, or null on failure.
     */
    public function verifyCredentials(string $employeeCode, string $password): ?object
    {
        $user = $this->directory()
            ->where($this->columns['employee_code'], $employeeCode)
            ->first();

        if (! $user) {
            return null;
        }

        if ($this->activeStatus !== null
            && ($user->{$this->columns['status']} ?? null) !== $this->activeStatus) {
            return null;
        }

        if (! hash_equals(
            (string) $user->{$this->columns['password']},
            $this->hashPassword($password)
        )) {
            return null;
        }

        return $user;
    }

    /**
     * Update the stored password (pass_jwt) for the "forgot password" flow.
     * Returns false when the employee code is unknown.
     */
    public function updatePassword(string $employeeCode, string $newPassword): bool
    {
        $affected = $this->directory()
            ->where($this->columns['employee_code'], $employeeCode)
            ->update([
                $this->columns['password'] => $this->hashPassword($newPassword),
            ]);

        return $affected > 0;
    }

    public function employeeExists(string $employeeCode): bool
    {
        return $this->directory()
            ->where($this->columns['employee_code'], $employeeCode)
            ->exists();
    }

    /**
     * Issue a fresh, self-contained access + refresh token pair for a user.
     * Nothing is persisted; the tokens carry their own claims and signature.
     *
     * @return array{access_token:string,refresh_token:string,token_type:string,expires_at:string,refresh_expires_at:string}
     */
    public function issueTokens(string $employeeCode): array
    {
        $access = $this->encodeToken($employeeCode, 'access', (int) config('backoffice.access_ttl'));
        $refresh = $this->encodeToken($employeeCode, 'refresh', (int) config('backoffice.refresh_ttl'));

        return [
            'access_token' => $access['token'],
            'refresh_token' => $refresh['token'],
            'token_type' => 'Bearer',
            'expires_at' => $access['expires_at']->toIso8601String(),
            'refresh_expires_at' => $refresh['expires_at']->toIso8601String(),
        ];
    }

    /**
     * Decode and verify a token, ensuring the signature is valid, it has not
     * expired, and it is of the expected type ("access" or "refresh").
     * Returns the payload claims on success, or null on any failure.
     *
     * @return array<string,mixed>|null
     */
    public function decodeToken(string $jwt, string $expectedType): ?array
    {
        $parts = explode('.', $jwt);

        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payloadSegment, $signature] = $parts;

        $expected = $this->base64UrlEncode(
            hash_hmac('sha256', $header.'.'.$payloadSegment, $this->signingKey(), true)
        );

        if (! hash_equals($expected, $signature)) {
            return null;
        }

        $payload = json_decode($this->base64UrlDecode($payloadSegment), true);

        if (! is_array($payload)) {
            return null;
        }

        if (($payload['type'] ?? null) !== $expectedType) {
            return null;
        }

        if (! isset($payload['exp']) || (int) $payload['exp'] < Carbon::now()->getTimestamp()) {
            return null;
        }

        return $payload;
    }

    /**
     * Validate a refresh token and issue a brand-new access + refresh pair
     * (with a fresh 24h window). Returns null when the token is invalid.
     *
     * Note: being stateless, the old refresh token remains valid until it
     * expires on its own — there is no server-side record to invalidate.
     *
     * @return array{tokens:array,employee_code:string}|null
     */
    public function refresh(string $refreshJwt): ?array
    {
        $payload = $this->decodeToken($refreshJwt, 'refresh');

        if (! $payload) {
            return null;
        }

        $employeeCode = (string) $payload['sub'];

        return [
            'tokens' => $this->issueTokens($employeeCode),
            'employee_code' => $employeeCode,
        ];
    }

    /**
     * Fetch the public-facing profile for an employee code.
     */
    public function profile(string $employeeCode): ?array
    {
        $user = $this->directory()
            ->where($this->columns['employee_code'], $employeeCode)
            ->first();

        return $user ? $this->presentUser($user) : null;
    }

    /**
     * Shape a raw directory record into the payload the frontend expects.
     */
    public function presentUser(object $user): array
    {
        return [
            'employee_code' => $user->employee_code ?? null,
            'email' => $user->email ?? null,
            'name_user' => $user->name_user ?? null,
            'channel' => $user->channel ?? null,
            'branch_code' => $user->brance_code ?? null,
            'branch_name' => $user->brance_name ?? null,
            'position' => $user->position ?? null,
            'role_id' => $user->role_id ?? null,
            'status' => $user->status ?? null,
        ];
    }

    private function directory()
    {
        return DB::connection($this->connection)->table($this->table);
    }

    private function hashPassword(string $password): string
    {
        return hash('sha256', $password);
    }

    /**
     * Build a signed token (compact JWS, HS256) with standard claims.
     *
     * @return array{token:string,expires_at:\Illuminate\Support\Carbon}
     */
    private function encodeToken(string $employeeCode, string $type, int $ttlMinutes): array
    {
        $issuedAt = Carbon::now();
        $expiresAt = $issuedAt->copy()->addMinutes($ttlMinutes);

        $header = $this->base64UrlEncode((string) json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = $this->base64UrlEncode((string) json_encode([
            'sub' => $employeeCode,
            'type' => $type,
            'jti' => Str::random(16),
            'iat' => $issuedAt->getTimestamp(),
            'exp' => $expiresAt->getTimestamp(),
        ]));

        $signature = $this->base64UrlEncode(
            hash_hmac('sha256', $header.'.'.$payload, $this->signingKey(), true)
        );

        return [
            'token' => $header.'.'.$payload.'.'.$signature,
            'expires_at' => $expiresAt,
        ];
    }

    /**
     * The HMAC signing secret, derived from the application key.
     */
    private function signingKey(): string
    {
        $key = (string) config('app.key');

        if (str_starts_with($key, 'base64:')) {
            $key = (string) base64_decode(substr($key, 7), true);
        }

        return $key;
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        return (string) base64_decode(strtr($value, '-_', '+/'), true);
    }
}
