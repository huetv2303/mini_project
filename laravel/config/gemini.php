<?php

return [
    'api_key'  => env('GEMINI_API_KEY'),
    'model'    => env('GEMINI_MODEL', 'gemini-2.5-flash'),
    'base_url' => 'https://generativelanguage.googleapis.com/v1beta/models',
    'embedding_model' => 'gemini-embedding-2',
    'generation' => [
        'temperature'     => 0.7,
        'topK'            => 40,
        'topP'            => 0.95,
        'maxOutputTokens' => 2048,
    ],
    'history' => [
        'max_messages' => 10,
        'ttl_hours'    => 24, // TTL cho Redis session (đối với guest)
    ],
];
