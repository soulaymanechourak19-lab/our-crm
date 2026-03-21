<?php

namespace App\Http\Controllers;

use Modules\User\Entities\SavedReport;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * List saved reports.
     */
    public function index(): JsonResponse
    {
        $reports = SavedReport::with('creator:id,name')
            ->where('created_by', auth()->id())
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($reports);
    }

    /**
     * Save a report config.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'config' => 'required|array',
            'config.source' => 'required|string|in:leads,customers,products,transactions,quotations',
            'config.chartType' => 'required|string|in:bar,line,pie,area,table',
        ]);

        $report = SavedReport::create([
            'name' => $validated['name'],
            'config' => $validated['config'],
            'created_by' => auth()->id(),
        ]);

        AuditService::logCreated($report);

        return response()->json($report, 201);
    }

    /**
     * Delete a saved report.
     */
    public function destroy(SavedReport $report): JsonResponse
    {
        AuditService::logDeleted($report);
        $report->delete();
        return response()->json(['message' => 'Report deleted']);
    }

    /**
     * Generate report data from config.
     */
    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'source' => 'required|string|in:leads,customers,products,transactions,quotations',
            'chartType' => 'required|string|in:bar,line,pie,area,table',
            'groupBy' => 'nullable|string',
            'metric' => 'nullable|string|in:count,sum,avg',
            'dateFrom' => 'nullable|date',
            'dateTo' => 'nullable|date',
        ]);

        $source = $request->source;
        $groupBy = $request->groupBy;
        $metric = $request->metric ?? 'count';
        $dateFrom = $request->dateFrom;
        $dateTo = $request->dateTo;

        $query = DB::table($source);

        // Apply date filters
        $dateColumn = $source === 'transactions' ? 'date' : 'created_at';
        if ($dateFrom) {
            $query->where($dateColumn, '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->where($dateColumn, '<=', $dateTo);
        }

        // Soft delete filter
        if (in_array($source, ['leads', 'customers'])) {
            $query->whereNull('deleted_at');
        }

        $data = [];

        // Generate data based on source and grouping
        if ($groupBy) {
            $valueExpr = match ($metric) {
                'sum' => match ($source) {
                    'transactions' => DB::raw('SUM(quantity * price) as value'),
                    'quotations' => DB::raw('SUM(total) as value'),
                    'products' => DB::raw('SUM(price) as value'),
                    default => DB::raw('COUNT(*) as value'),
                },
                'avg' => match ($source) {
                    'transactions' => DB::raw('AVG(quantity * price) as value'),
                    'quotations' => DB::raw('AVG(total) as value'),
                    'products' => DB::raw('AVG(price) as value'),
                    default => DB::raw('COUNT(*) as value'),
                },
                default => DB::raw('COUNT(*) as value'),
            };

            if ($groupBy === 'month') {
                $data = $query->select(
                    DB::raw("DATE_FORMAT({$dateColumn}, '%Y-%m') as label"),
                    $valueExpr
                )
                ->groupBy('label')
                ->orderBy('label')
                ->get();
            } else {
                $data = $query->select("{$groupBy} as label", $valueExpr)
                    ->groupBy($groupBy)
                    ->orderByDesc('value')
                    ->limit(20)
                    ->get();
            }
        } else {
            // Simple count
            $data = [['label' => ucfirst($source), 'value' => $query->count()]];
        }

        return response()->json([
            'source' => $source,
            'chart_type' => $request->chartType,
            'data' => $data,
        ]);
    }

    /**
     * Export report data to CSV.
     */
    public function export(Request $request)
    {
        $request->validate([
            'source' => 'required|string|in:leads,customers,products,transactions,quotations',
        ]);

        $source = $request->source;
        $query = DB::table($source);

        if (in_array($source, ['leads', 'customers'])) {
            $query->whereNull('deleted_at');
        }

        if ($request->dateFrom) {
            $col = $source === 'transactions' ? 'date' : 'created_at';
            $query->where($col, '>=', $request->dateFrom);
        }
        if ($request->dateTo) {
            $col = $source === 'transactions' ? 'date' : 'created_at';
            $query->where($col, '<=', $request->dateTo);
        }

        $rows = $query->limit(5000)->get();

        if ($rows->isEmpty()) {
            return response('No data', 404);
        }

        $headers = array_keys((array) $rows->first());
        $csv = implode(',', $headers) . "\n";
        foreach ($rows as $row) {
            $values = array_map(function ($v) {
                return '"' . str_replace('"', '""', (string) ($v ?? '')) . '"';
            }, array_values((array) $row));
            $csv .= implode(',', $values) . "\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$source}_report_" . now()->format('Y-m-d') . ".csv\"",
        ]);
    }
}
