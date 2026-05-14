<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$apiKey = config('gemini.api_key');
$model = config('gemini.embedding_model');
$baseUrl = config('gemini.base_url');

$response = \Illuminate\Support\Facades\Http::withHeaders(['Content-Type' => 'application/json'])
    ->post("{$baseUrl}/{$model}:embedContent?key={$apiKey}", [
        'model' => 'models/' . $model,
        'content' => ['parts' => [['text' => 'hello size M']]]
    ]);

echo json_encode($response->json());
