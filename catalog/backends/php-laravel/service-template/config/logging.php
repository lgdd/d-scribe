<?php

return [
    'default' => env('LOG_CHANNEL', 'stdout'),
    'channels' => [
        'stdout' => [
            'driver' => 'monolog',
            'handler' => Monolog\Handler\StreamHandler::class,
            'with' => ['stream' => 'php://stdout'],
            'formatter' => Monolog\Formatter\JsonFormatter::class,
            'level' => 'info',
        ],
    ],
];
