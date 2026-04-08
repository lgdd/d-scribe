<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

// Pattern: SIEM — structured audit log for auth-relevant events
// Adapt: log fields relevant to your domain's security events

class AuditLogMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        Log::channel('stdout')->info('request', [
            'method' => $request->method(),
            'path' => $request->path(),
            'status' => $response->getStatusCode(),
            'remote' => $request->ip(),
        ]);
        return $response;
    }
}
