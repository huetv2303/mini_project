<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$orders = App\Models\Order::latest()->take(5)->get();
foreach($orders as $o) {
    echo $o->code . ' | ' . $o->payment_status . ' | ' . $o->status . PHP_EOL;
}
