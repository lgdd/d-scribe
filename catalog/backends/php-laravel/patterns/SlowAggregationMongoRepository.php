<?php

// Pattern: DBM slow aggregation — expensive pipeline on large collection
// Adapt: replace collection and field names with domain entities

function aggregateEvents(): array
{
    $manager = new MongoDB\Driver\Manager(env('MONGODB_URL', 'mongodb://demo:demo@mongodb:27017/demo'));
    $command = new MongoDB\Driver\Command([
        'aggregate' => 'events',
        'pipeline' => [
            ['$group' => ['_id' => '$category', 'total' => ['$sum' => '$amount'], 'count' => ['$sum' => 1]]],
            ['$sort' => ['total' => -1]],
            ['$limit' => 10],
        ],
        'cursor' => new stdClass(),
    ]);
    return $manager->executeCommand('demo', $command)->toArray();
}
