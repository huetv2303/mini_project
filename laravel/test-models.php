<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$apiKey = config('gemini.api_key');
$models = ['gemini-flash-latest', 'gemini-pro-latest', 'gemini-2.0-flash-lite-001', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];

foreach ($models as $model) {
    $response = \Illuminate\Support\Facades\Http::withHeaders(['Content-Type' => 'application/json'])
        ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
            'contents' => [['role' => 'user', 'parts' => [['text' => 'hello']]]]
        ]);

    echo "Model: {$model} -> HTTP " . $response->status() . "\n";
    if ($response->failed()) {
        $data = $response->json();
        echo "Error: " . ($data['error']['message'] ?? 'Unknown error') . "\n";
    }
    echo "--------------------------\n";
}
