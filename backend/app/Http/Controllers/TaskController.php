<?php

namespace App\Http\Controllers;

use Modules\User\Entities\Task;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TaskController extends Controller
{
    /**
     * List tasks with filters and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Task::with(['lead:id,company_name,contact_name', 'customer:id,name', 'assignee:id,name', 'creator:id,name']);

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }
        if ($request->filled('overdue') && $request->overdue === 'true') {
            $query->overdue();
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $query->orderByRaw("FIELD(priority, 'urgent', 'high', 'medium', 'low')")
              ->orderBy('due_date', 'asc');

        $tasks = $query->paginate($request->per_page ?? 20);

        return response()->json($tasks);
    }

    /**
     * Get current user's tasks.
     */
    public function myTasks(Request $request): JsonResponse
    {
        $request->merge(['assigned_to' => auth()->id()]);
        return $this->index($request);
    }

    /**
     * Create a new task.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'in:call,email,meeting,follow_up,other',
            'priority' => 'in:low,medium,high,urgent',
            'due_date' => 'nullable|date',
            'lead_id' => 'nullable|exists:leads,id',
            'customer_id' => 'nullable|exists:customers,id',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $validated['created_by'] = auth()->id();
        $validated['assigned_to'] = $validated['assigned_to'] ?? auth()->id();

        $task = Task::create($validated);
        $task->load(['lead:id,company_name,contact_name', 'customer:id,name', 'assignee:id,name']);

        AuditService::logCreated($task);

        return response()->json($task, 201);
    }

    /**
     * Show a single task.
     */
    public function show(Task $task): JsonResponse
    {
        $task->load(['lead', 'customer', 'assignee:id,name', 'creator:id,name']);
        return response()->json($task);
    }

    /**
     * Update a task.
     */
    public function update(Request $request, Task $task): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'type' => 'in:call,email,meeting,follow_up,other',
            'priority' => 'in:low,medium,high,urgent',
            'status' => 'in:pending,in_progress,completed,cancelled',
            'due_date' => 'nullable|date',
            'lead_id' => 'nullable|exists:leads,id',
            'customer_id' => 'nullable|exists:customers,id',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        if (isset($validated['status']) && $validated['status'] === 'completed') {
            $validated['completed_at'] = now();
        }

        $task->fill($validated);
        AuditService::logUpdated($task);
        $task->save();

        return response()->json($task->fresh(['lead:id,company_name,contact_name', 'customer:id,name', 'assignee:id,name']));
    }

    /**
     * Mark a task as completed.
     */
    public function complete(Task $task): JsonResponse
    {
        $task->fill(['status' => 'completed', 'completed_at' => now()]);
        AuditService::logUpdated($task);
        $task->save();

        return response()->json(['message' => 'Task completed', 'task' => $task]);
    }

    /**
     * Delete a task.
     */
    public function destroy(Task $task): JsonResponse
    {
        AuditService::logDeleted($task);
        $task->delete();

        return response()->json(['message' => 'Task deleted']);
    }
}
