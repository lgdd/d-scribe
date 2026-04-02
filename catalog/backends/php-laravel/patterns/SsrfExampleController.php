<?php

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

// Pattern: Code Security — SSRF via unvalidated URL parameter
// WARNING: intentionally vulnerable for IAST demo

function fetchUrl(Request $request): JsonResponse
{
    $url = $request->query('url', '');
    $content = file_get_contents($url);
    return response()->json(['body' => $content]);
}
