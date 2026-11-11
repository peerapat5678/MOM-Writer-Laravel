<?php

namespace App\Http\Middleware;

use App\Services\BackofficeAuthService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards backoffice routes with the stateless, signed access token issued at
 * login. On success it stamps the resolved employee_code onto the request.
 */
class BackofficeAuth
{
    public function __construct(private BackofficeAuthService $auth)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $bearer = $request->bearerToken();

        $payload = $bearer ? $this->auth->decodeToken($bearer, 'access') : null;

        if (! $payload) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        $request->attributes->set('employee_code', (string) $payload['sub']);

        return $next($request);
    }
}
