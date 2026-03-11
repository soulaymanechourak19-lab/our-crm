<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Export CRM data as CSV files for ML model training.
 * Usage: php artisan ml:export-data
 */
class ExportMLData extends Command
{
    protected $signature = 'ml:export-data {--path=storage/app/ml : Export directory}';
    protected $description = 'Export CRM data as CSV files for ML model training';

    public function handle(): int
    {
        $path = $this->option('path');

        if (!is_dir($path)) {
            mkdir($path, 0755, true);
        }

        $this->info('Exporting CRM data for ML training...');

        // Customers
        $customers = DB::table('customers')->whereNull('deleted_at')->get();
        $this->exportCsv($path . '/customers.csv', $customers);
        $this->info("  ✅ Exported {$customers->count()} customers");

        // Interactions
        $interactions = DB::table('interactions')->get();
        $this->exportCsv($path . '/interactions.csv', $interactions);
        $this->info("  ✅ Exported {$interactions->count()} interactions");

        // Leads
        $leads = DB::table('leads')->whereNull('deleted_at')->get();
        $this->exportCsv($path . '/leads.csv', $leads);
        $this->info("  ✅ Exported {$leads->count()} leads");

        // Products
        $products = DB::table('products')->get();
        $this->exportCsv($path . '/products.csv', $products);
        $this->info("  ✅ Exported {$products->count()} products");

        $this->newLine();
        $this->info("📁 Data exported to: {$path}/");

        return Command::SUCCESS;
    }

    protected function exportCsv(string $file, $data): void
    {
        if ($data->isEmpty()) {
            file_put_contents($file, '');
            return;
        }

        $handle = fopen($file, 'w');
        $headers = array_keys((array) $data->first());
        fputcsv($handle, $headers);

        foreach ($data as $row) {
            fputcsv($handle, (array) $row);
        }

        fclose($handle);
    }
}
