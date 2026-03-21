<?php
$log = file_get_contents(__DIR__ . '/storage/logs/laravel.log');
$lines = explode("\n", $log);
$lastErrorIdx = -1;
for ($i = count($lines) - 1; $i >= 0; $i--) {
    if (strpos($lines[$i], 'local.ERROR') !== false) {
        $lastErrorIdx = $i;
        break;
    }
}
if ($lastErrorIdx >= 0) {
    $errorLine = $lines[$lastErrorIdx];
    file_put_contents(__DIR__ . '/last_error.txt', $errorLine);
    echo "Written to last_error.txt\n";
}
