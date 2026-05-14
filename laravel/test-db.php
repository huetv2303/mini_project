<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$statuses = \App\Models\Product::whereHas('variants', function($q) {
    $q->where('name', 'like', '%Size X%')->orWhere('name', 'like', '%Size M%');
})->pluck('status');

echo "Statuses of products with Size X or M: \n";
foreach($statuses as $s) {
    echo "- $s\n";
}
