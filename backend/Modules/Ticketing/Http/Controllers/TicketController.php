<?php

namespace Modules\Ticketing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Ticketing\Entities\Ticket;
use Modules\Ticketing\Entities\TicketHistory;
use Modules\Ticketing\Services\TicketAssignmentService;
use Modules\Ticketing\Services\TicketPriorityService;
use Modules\Ticketing\Events\TicketCreated;
use Modules\Ticketing\Events\TicketStatusChanged;
use Modules\Ticketing\Events\TicketAssigned;
use Illuminate\Support\Facades\DB;

class TicketController extends Controller
{
    // ═══════════════════════════════════════════════════════════════════
    //  LISTE DES TICKETS (avec filtres et pagination)
    // ═══════════════════════════════════════════════════════════════════

    public function index(Request $request): JsonResponse
    {
        $query = Ticket::with(['customer:id,name,email', 'assignedAgent:id,name,email']);

        // Filtrer par statut
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filtrer par priorité
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        // Filtrer par agent assigné
        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        // Filtrer par client
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        // Recherche par titre ou numéro de ticket
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'LIKE', "%{$search}%")
                  ->orWhere('ticket_number', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        $tickets = $query->orderByDesc('created_at')
                         ->paginate($request->get('per_page', 15));

        return response()->json($tickets);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  DÉTAIL D'UN TICKET
    // ═══════════════════════════════════════════════════════════════════

    public function show(Ticket $ticket): JsonResponse
    {
        $ticket->load([
            'customer:id,name,email,phone',
            'assignedAgent:id,name,email',
            'creator:id,name',
            'comments' => function ($q) {
                $q->with('user:id,name');
            },
            'history' => function ($q) {
                $q->with('changedBy:id,name');
            },
        ]);

        return response()->json($ticket);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  CRÉATION D'UN TICKET
    // ═══════════════════════════════════════════════════════════════════

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'required|string',
            'customer_id' => 'nullable|exists:customers,id',
            'priority'    => 'nullable|in:low,medium,high,critical',
            'source'      => 'nullable|string|max:50',
            'category'    => 'nullable|string|max:255',
            // Champs optionnels pour l'intégration chatbot
            'sentiment_urgency' => 'nullable|string|max:50',
        ]);

        // Générer le numéro de ticket
        $validated['ticket_number'] = Ticket::generateTicketNumber();
        $validated['created_by'] = auth()->id();

        // Priorisation automatique si non spécifiée
        if (empty($validated['priority'])) {
            $priorityService = new TicketPriorityService();
            $validated['priority'] = $priorityService->detectPriority(
                $validated['description'],
                $validated['sentiment_urgency'] ?? null
            );
        }
        unset($validated['sentiment_urgency']);

        $ticket = Ticket::create($validated);

        // Auto-attribution à l'agent SAV le moins occupé
        $assignmentService = new TicketAssignmentService();
        $agent = $assignmentService->assignToLeastBusyAgent($ticket);

        // Déclencher les événements
        event(new TicketCreated($ticket));
        if ($agent) {
            event(new TicketAssigned($ticket, null, $agent->id));
        }

        $ticket->load(['customer:id,name,email', 'assignedAgent:id,name,email']);

        return response()->json($ticket, 201);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  MISE À JOUR D'UN TICKET
    // ═══════════════════════════════════════════════════════════════════

    public function update(Request $request, Ticket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'title'       => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'priority'    => 'sometimes|in:low,medium,high,critical',
            'category'    => 'nullable|string|max:255',
        ]);

        $ticket->update($validated);
        $ticket->load(['customer:id,name,email', 'assignedAgent:id,name,email']);

        return response()->json($ticket);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  CHANGEMENT DE STATUT
    // ═══════════════════════════════════════════════════════════════════

    public function updateStatus(Request $request, Ticket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed',
        ]);

        $oldStatus = $ticket->status;
        $newStatus = $validated['status'];

        if ($oldStatus === $newStatus) {
            return response()->json(['message' => 'Le statut est déjà ' . $newStatus], 422);
        }

        $ticket->status = $newStatus;

        // Marquer la date de résolution
        if ($newStatus === Ticket::STATUS_RESOLVED && !$ticket->resolved_at) {
            $ticket->resolved_at = now();
        }

        $ticket->save();

        // Déclencher l'événement (notification + historique)
        event(new TicketStatusChanged($ticket, $oldStatus, $newStatus, auth()->id()));

        $ticket->load(['customer:id,name,email', 'assignedAgent:id,name,email']);

        return response()->json($ticket);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  ASSIGNATION D'UN TICKET
    // ═══════════════════════════════════════════════════════════════════

    public function assign(Request $request, Ticket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $previousAgent = $ticket->assigned_to;
        $ticket->assigned_to = $validated['assigned_to'];
        $ticket->save();

        // Historique du changement d'assignation
        TicketHistory::create([
            'ticket_id'  => $ticket->id,
            'changed_by' => auth()->id(),
            'field'      => 'assigned_to',
            'old_value'  => $previousAgent ? (string) $previousAgent : null,
            'new_value'  => (string) $validated['assigned_to'],
        ]);

        event(new TicketAssigned($ticket, $previousAgent, $validated['assigned_to']));

        $ticket->load(['customer:id,name,email', 'assignedAgent:id,name,email']);

        return response()->json($ticket);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  SUPPRESSION D'UN TICKET
    // ═══════════════════════════════════════════════════════════════════

    public function destroy(Ticket $ticket): JsonResponse
    {
        $ticket->delete();

        return response()->json(['message' => 'Ticket supprimé avec succès.']);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  STATISTIQUES SAV (Dashboard)
    // ═══════════════════════════════════════════════════════════════════

    public function stats(): JsonResponse
    {
        try {
            $stats = [
                'total'       => Ticket::count(),
                'open'        => Ticket::where('status', 'open')->count(),
                'in_progress' => Ticket::where('status', 'in_progress')->count(),
                'resolved'    => Ticket::where('status', 'resolved')->count(),
                'closed'      => Ticket::where('status', 'closed')->count(),

                // Par priorité
                'by_priority' => [
                    'low'      => Ticket::where('priority', 'low')->count(),
                    'medium'   => Ticket::where('priority', 'medium')->count(),
                    'high'     => Ticket::where('priority', 'high')->count(),
                    'critical' => Ticket::where('priority', 'critical')->count(),
                ],

                // Temps moyen de résolution (en heures)
                'avg_resolution_hours' => round(
                    Ticket::whereNotNull('resolved_at')
                        ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as avg_hours')
                        ->value('avg_hours') ?? 0,
                    1
                ),

                // Tickets par agent
                'by_agent' => DB::table('tickets')
                    ->join('users', 'tickets.assigned_to', '=', 'users.id')
                    ->select('users.name', DB::raw('COUNT(*) as total'))
                    ->whereIn('tickets.status', ['open', 'in_progress'])
                    ->groupBy('users.name')
                    ->get(),

                // Tickets récents (7 derniers jours)
                'recent_count' => Ticket::where('created_at', '>=', now()->subDays(7))->count(),
            ];

            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => substr($e->getTraceAsString(), 0, 500)
            ], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //  CRÉATION DE TICKET DEPUIS LE CHATBOT (endpoint spécial)
    // ═══════════════════════════════════════════════════════════════════

    public function createFromChatbot(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id'       => 'nullable|exists:customers,id',
            'title'             => 'required|string|max:255',
            'description'       => 'required|string',
            'category'          => 'nullable|string|max:255',
            'sentiment_urgency' => 'nullable|string|max:50',
            'conversation'      => 'nullable|string',
        ]);

        // Ajouter la conversation à la description si fournie
        $description = $validated['description'];
        if (!empty($validated['conversation'])) {
            $description .= "\n\n--- Conversation Chatbot ---\n" . $validated['conversation'];
        }

        // Priorisation automatique via analyse de sentiment
        $priorityService = new TicketPriorityService();
        $priority = $priorityService->detectPriority(
            $description,
            $validated['sentiment_urgency'] ?? null
        );

        $ticket = Ticket::create([
            'ticket_number' => Ticket::generateTicketNumber(),
            'title'         => $validated['title'],
            'description'   => $description,
            'customer_id'   => $validated['customer_id'] ?? null,
            'priority'      => $priority,
            'source'        => 'chatbot',
            'category'      => $validated['category'] ?? null,
            'created_by'    => auth()->id() ?? null,
        ]);

        // Auto-attribution
        $assignmentService = new TicketAssignmentService();
        $agent = $assignmentService->assignToLeastBusyAgent($ticket);

        event(new TicketCreated($ticket));
        if ($agent) {
            event(new TicketAssigned($ticket, null, $agent->id));
        }

        $ticket->load(['customer:id,name,email', 'assignedAgent:id,name,email']);

        return response()->json([
            'message' => 'Ticket créé depuis le chatbot avec succès.',
            'ticket'  => $ticket,
        ], 201);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  LISTE DES AGENTS SAV (pour l'assignation)
    // ═══════════════════════════════════════════════════════════════════

    public function agents(): JsonResponse
    {
        $agents = \Modules\User\Entities\User::whereIn('role', ['agent_sav', 'admin'])
            ->select('id', 'name', 'email', 'role')
            ->get();

        // Add open ticket count for each agent
        $agents->each(function ($agent) {
            $agent->open_tickets_count = Ticket::where('assigned_to', $agent->id)
                ->whereIn('status', ['open', 'in_progress'])
                ->count();
        });

        return response()->json($agents);
    }
}
