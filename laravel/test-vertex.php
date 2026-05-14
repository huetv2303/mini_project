<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

function getVertexToken() {
    $keyPath = config('gemini.vertex.credentials_path');
    echo "Reading key from: $keyPath\n";
    if (!file_exists($keyPath)) die("File not found\n");
    
    $keyData = json_decode(file_get_contents($keyPath), true);
    $clientEmail = $keyData['client_email'];
    $privateKey = $keyData['private_key'];

    $now = time();
    $header = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
    $payload = base64_encode(json_encode([
        'iss' => $clientEmail,
        'scope' => 'https://www.googleapis.com/auth/cloud-platform',
        'aud' => 'https://oauth2.googleapis.com/token',
        'iat' => $now,
        'exp' => $now + 3600
    ]));

    $signature = '';
    openssl_sign("$header.$payload", $signature, $privateKey, OPENSSL_ALGO_SHA256);
    $jwt = "$header.$payload." . base64_encode($signature);

    $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion' => $jwt
    ]);

    if ($response->failed()) die("Token error: " . $response->body() . "\n");
    return $response->json()['access_token'];
}

try {
    $token = getVertexToken();
    echo "Token OK\n";
    
    $projectId = config('gemini.vertex.project_id');
    $location = config('gemini.vertex.location');
    $model = config('gemini.model', 'gemini-1.5-flash-002');
    
    $url = "https://{$location}-aiplatform.googleapis.com/v1/projects/{$projectId}/locations/{$location}/publishers/google/models/{$model}:generateContent";
    
    echo "Calling URL: $url\n";
    $response = Http::withToken($token)
        ->post($url, [
            'contents' => [['role' => 'user', 'parts' => [['text' => 'Hello Vertex AI']]]]
        ]);
        
    echo "Status: " . $response->status() . "\n";
    echo "Body: " . $response->body() . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
