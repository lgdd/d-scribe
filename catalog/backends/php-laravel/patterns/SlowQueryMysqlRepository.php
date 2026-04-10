<?php

use Illuminate\Support\Facades\DB;

// Pattern: DBM slow query — artificial delay via MySQL SLEEP
// Adapt: replace 'your_table' with a domain entity table

function findAllSlowMysql(): array
{
    return DB::select("SELECT *, SLEEP(0.3) FROM your_table ORDER BY created_at DESC LIMIT 50");
}
