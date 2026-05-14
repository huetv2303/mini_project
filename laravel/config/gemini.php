<?php

return [
    'api_key'  => env('GEMINI_API_KEY'),
    'model'    => env('GEMINI_MODEL', 'gemini-1.5-flash'),
    'base_url' => 'https://generativelanguage.googleapis.com/v1beta/models',
    
    // Cấu hình Vertex AI
    'use_vertex' => env('USE_VERTEX_AI', true), // Bật Vertex AI mặc định nếu đã cấu hình
    'vertex' => [
        'project_id' => env('VERTEX_PROJECT_ID'),
        'location'   => env('VERTEX_LOCATION', 'us-central1'),
        'credentials_path' => base_path(env('GOOGLE_APPLICATION_CREDENTIALS', 'google-key.json')),
    ],

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
