<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BackofficeAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private BackofficeAuthService $auth)
    {
    }

    /**
     * Authenticate with employee_code + password (checked against pass_jwt),
     * and return an access token plus a 24h refresh token.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_code' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = $this->auth->verifyCredentials($validated['employee_code'], $validated['password']);

        if (! $user) {
            return response()->json([
                'status' => false,
                'message' => 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง',
            ], 401);
        }

        $tokens = $this->auth->issueTokens($user->employee_code);

        return response()->json([
            'status' => true,
            'message' => 'Login success',
            'data' => array_merge($tokens, [
                'user' => $this->auth->presentUser($user),
            ]),
        ]);
    }

    /**
     * Exchange a valid refresh token for a new access + refresh pair.
     */
    public function refresh(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'refresh_token' => ['required', 'string'],
        ]);

        $result = $this->auth->refresh($validated['refresh_token']);

        if (! $result) {
            return response()->json([
                'status' => false,
                'message' => 'Refresh token ไม่ถูกต้องหรือหมดอายุ',
            ], 401);
        }

        return response()->json([
            'status' => true,
            'message' => 'Token refreshed',
            'data' => array_merge($result['tokens'], [
                'user' => $this->auth->profile($result['employee_code']),
            ]),
        ]);
    }

    /**
     * Return the authenticated user's profile (requires the access token).
     */
    public function me(Request $request): JsonResponse
    {
        $employeeCode = $request->attributes->get('employee_code');

        return response()->json([
            'status' => true,
            'user' => $this->auth->profile($employeeCode),
        ]);
    }

    /**
     * Log out. Tokens are stateless (signed JWTs) so there is nothing to revoke
     * server-side; the client discards its stored access + refresh tokens. Any
     * already-issued access token stays valid until it expires on its own.
     */
    public function logout(Request $request): JsonResponse
    {
        return response()->json([
            'status' => true,
            'message' => 'Logout success',
        ]);
    }

    /**
     * Forgot password: set a new password (pass_jwt) for an employee_code.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_code' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $updated = $this->auth->updatePassword($validated['employee_code'], $validated['password']);

        if (! $updated) {
            return response()->json([
                'status' => false,
                'message' => 'ไม่พบรหัสพนักงานนี้ในระบบ',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'message' => 'ตั้งรหัสผ่านใหม่สำเร็จ',
            'user' => [
                'employee_code' => $validated['employee_code'],
            ],
        ]);
    }
}
