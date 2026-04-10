<?php

// Pattern: DBM unindexed query — collection scan (COLLSCAN)
// Adapt: replace collection and field names with domain entities

function findByCategory(string $category): array
{
    $manager = new MongoDB\Driver\Manager(env('MONGODB_URL', 'mongodb://demo:demo@mongodb:27017/demo'));
    $query = new MongoDB\Driver\Query(
        ['category' => $category],
        ['sort' => ['created_at' => -1], 'limit' => 50]
    );
    return $manager->executeQuery('demo.events', $query)->toArray();
}
