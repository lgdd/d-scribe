<?php

use Illuminate\Http\JsonResponse;

// Pattern: Profiling — CPU-intensive nested loop
// Adapt: replace with domain-relevant aggregation logic

function aggregate(): JsonResponse
{
    $counts = [];
    for ($i = 0; $i < 100; $i++) {
        $counts = [];
        for ($j = 0; $j < 10000; $j++) {
            $key = 'bucket-' . ($j % 50);
            $counts[$key] = ($counts[$key] ?? 0) + 1;
        }
    }
    return response()->json(['buckets' => count($counts), 'iterations' => 100 * 10000]);
}
