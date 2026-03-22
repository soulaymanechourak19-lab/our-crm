<?php

use Illuminate\Support\Facades\Route;
use Modules\Ticketing\Http\Controllers\TicketController;
use Modules\Ticketing\Http\Controllers\TicketCommentController;

/*
|--------------------------------------------------------------------------
| Ticketing Module API Routes
|--------------------------------------------------------------------------
|
| Toutes les routes sont protégées par auth:sanctum.
| Seuls les agents SAV et admins peuvent gérer les tickets.
|
*/

Route::middleware('auth:sanctum')->group(function () {

    // ── Statistiques SAV ────────────────────────────────────────────
    Route::get('tickets/stats', [TicketController::class, 'stats']);

    // ── Liste des agents SAV (pour assignation) ─────────────────────
    Route::get('tickets/agents', [TicketController::class, 'agents']);

    // ── CRUD Tickets ────────────────────────────────────────────────
    Route::apiResource('tickets', TicketController::class);

    // ── Actions spéciales sur un ticket ─────────────────────────────
    Route::put('tickets/{ticket}/status', [TicketController::class, 'updateStatus']);
    Route::put('tickets/{ticket}/assign', [TicketController::class, 'assign']);

    // ── Commentaires d'un ticket ────────────────────────────────────
    Route::get('tickets/{ticket}/comments', [TicketCommentController::class, 'index']);
    Route::post('tickets/{ticket}/comments', [TicketCommentController::class, 'store']);
    Route::delete('tickets/{ticket}/comments/{comment}', [TicketCommentController::class, 'destroy']);

    // ── Endpoint pour le chatbot (création automatique de ticket) ───
    Route::post('tickets/from-chatbot', [TicketController::class, 'createFromChatbot']);

    // ── Tickets d'un client spécifique (pour la fiche client CRM) ──
    Route::get('customers/{customerId}/tickets', function ($customerId) {
        $tickets = \Modules\Ticketing\Entities\Ticket::where('customer_id', $customerId)
            ->with('assignedAgent:id,name')
            ->orderByDesc('created_at')
            ->get();
        return response()->json($tickets);
    });
});
