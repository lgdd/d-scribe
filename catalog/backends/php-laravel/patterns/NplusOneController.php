<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

// Pattern: DBM N+1 — one query per parent row
// Adapt: replace table/column names with domain entities

function itemsWithDetails(): JsonResponse
{
    $parents = DB::select("SELECT * FROM parents");
    $results = [];
    foreach ($parents as $parent) {
        $children = DB::select("SELECT * FROM children WHERE parent_id = ?", [$parent->id]);
        $results[] = ['parent' => $parent, 'children' => $children];
    }
    return response()->json($results);
}
