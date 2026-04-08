<?php

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

// Pattern: Profiling — gradual memory allocation in a cache
// Adapt: use a domain-relevant cache concept

$cache = [];

function addToCache(Request $request): JsonResponse
{
    global $cache;
    $key = $request->query('key', 'default');
    $cache[$key] = str_repeat('x', 1024 * 100); // 100KB per entry
    return response()->json(['cached' => count($cache), 'key' => $key]);
}
