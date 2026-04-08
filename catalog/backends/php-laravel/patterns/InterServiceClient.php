<?php

use Illuminate\Support\Facades\Http;

// Pattern: Cross-service HTTP call — tracing headers propagated
// automatically by dd-trace-php. Adapt: inject the target service
// URL via environment variable.

function call(string $path): array
{
    $baseUrl = env('TARGET_SERVICE_URL', 'http://localhost:8080');
    $response = Http::timeout(5)->get($baseUrl . $path);
    return $response->json();
}
