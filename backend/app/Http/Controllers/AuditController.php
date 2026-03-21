<?php

namespace App\Http\Controllers;

use Modules\User\Entities\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuditController extends Controller
{
    /**
     * List audit logs with pagination and filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('user:id,name,email')->orderBy('created_at', 'desc');

        if ($request->filled('user_id')) {
            $query->byUser($request->user_id);
        }
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }
        if ($request->filled('entity_type')) {
            // Accept short names like "Lead", "Customer"
            $typeMap = [
                'Lead' => 'Modules\\User\\Entities\\Lead',
                'Customer' => 'Modules\\User\\Entities\\Customer',
                'Task' => 'Modules\\User\\Entities\\Task',
                'User' => 'Modules\\User\\Entities\\User',
                'Quotation' => 'Modules\\User\\Entities\\Quotation',
                'Discount' => 'Modules\\User\\Entities\\Discount',
                'EmailTemplate' => 'Modules\\User\\Entities\\EmailTemplate',
            ];
            $fqcn = $typeMap[$request->entity_type] ?? $request->entity_type;
            $query->where('auditable_type', $fqcn);
        }
        if ($request->filled('from')) {
            $query->where('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->where('created_at', '<=', $request->to);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%"))
                  ->orWhere('auditable_id', $search);
            });
        }

        $logs = $query->paginate($request->per_page ?? 25);

        // Append computed attributes
        $logs->getCollection()->transform(function ($log) {
            $log->entity_label = $log->entity_label;
            $log->changed_fields = $log->changed_fields;
            return $log;
        });

        return response()->json($logs);
    }

    /**
     * Show a single audit log entry.
     */
    public function show(AuditLog $auditLog): JsonResponse
    {
        $auditLog->load('user:id,name,email');
        $auditLog->entity_label = $auditLog->entity_label;
        $auditLog->changed_fields = $auditLog->changed_fields;

        return response()->json($auditLog);
    }

    /**
     * Export audit logs to CSV.
     */
    public function export(Request $request)
    {
        $query = AuditLog::with('user:id,name')->orderBy('created_at', 'desc');

        if ($request->filled('from')) {
            $query->where('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->where('created_at', '<=', $request->to);
        }

        $logs = $query->limit(5000)->get();

        $csv = "ID,User,Action,Entity,Entity ID,Date,IP Address\n";
        foreach ($logs as $log) {
            $csv .= implode(',', [
                $log->id,
                '"' . ($log->user->name ?? 'System') . '"',
                $log->action,
                '"' . $log->entity_label . '"',
                $log->auditable_id,
                $log->created_at->toISOString(),
                $log->ip_address ?? '',
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="audit_logs_' . now()->format('Y-m-d') . '.csv"',
        ]);
    }
}
