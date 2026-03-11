<?php

namespace App\Console\Commands;

use App\Services\AIService;
use Illuminate\Console\Command;

/**
 * Train all ML models via the microservice.
 * Usage: php artisan ml:train
 */
class TrainMLModels extends Command
{
    protected $signature = 'ml:train {--model=all : Model to train (all|churn|scoring|segmentation|recommender)}';
    protected $description = 'Train ML models via the microservice';

    public function handle(): int
    {
        $ai = new AIService();
        $model = $this->option('model');

        $this->info("🤖 Training ML model: {$model}");

        $result = match ($model) {
            'churn' => $ai->trainChurn(),
            'scoring' => $ai->trainScoring(),
            'segmentation' => $ai->trainSegmentation(),
            'recommender' => $ai->trainRecommender(),
            default => $ai->trainAll(),
        };

        if (isset($result['error'])) {
            $this->error("❌ Training failed: " . $result['error']);
            return Command::FAILURE;
        }

        $this->info("✅ Training completed!");
        $this->table(['Metric', 'Value'], $this->flattenResults($result));

        return Command::SUCCESS;
    }

    protected function flattenResults(array $data, string $prefix = ''): array
    {
        $rows = [];
        foreach ($data as $key => $value) {
            $fullKey = $prefix ? "{$prefix}.{$key}" : $key;
            if (is_array($value)) {
                $rows = array_merge($rows, $this->flattenResults($value, $fullKey));
            } else {
                $rows[] = [$fullKey, is_bool($value) ? ($value ? 'true' : 'false') : (string) $value];
            }
        }
        return $rows;
    }
}
