<?php

use Illuminate\Support\Facades\DB;

// Pattern: DBM slow query — artificial delay via pg_sleep
// Adapt: replace 'your_table' with a domain entity table

function findAllSlow(): array
{
    return DB::select("SELECT *, pg_sleep(0.3) FROM your_table ORDER BY created_at DESC LIMIT 50");
}
