<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

// Pattern: Code Security — SQL injection via string concat
// WARNING: intentionally vulnerable for IAST demo

function search(Request $request): JsonResponse
{
    $q = $request->query('q', '');
    $rows = DB::select("SELECT * FROM items WHERE name LIKE '%" . $q . "%'");
    return response()->json($rows);
}
