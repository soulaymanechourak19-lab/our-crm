<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = app(\App\Http\Controllers\ChatbotTrainingController::class);

echo "Seeding data...\n";
$res1 = $controller->seed();
echo $res1->content() . "\n\n";

echo "Training ML model...\n";
$res2 = $controller->trainModel();
echo $res2->content() . "\n";
