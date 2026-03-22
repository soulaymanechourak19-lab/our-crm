<?php

namespace Modules\Ticketing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Ticketing\Entities\Ticket;
use Modules\Ticketing\Entities\TicketComment;

class TicketCommentController extends Controller
{
    /**
     * Liste des commentaires d'un ticket.
     * Les commentaires internes ne sont pas visibles si l'utilisateur n'est pas agent/admin.
     */
    public function index(Ticket $ticket): JsonResponse
    {
        $user = auth()->user();
        $query = $ticket->comments()->with('user:id,name');

        // Si l'utilisateur n'est pas admin ou agent_sav, masquer les commentaires internes
        if ($user && !in_array($user->role, ['admin', 'agent_sav'])) {
            $query->where('is_internal', false);
        }

        $comments = $query->orderBy('created_at', 'asc')->get();

        return response()->json($comments);
    }

    /**
     * Ajouter un commentaire à un ticket.
     */
    public function store(Request $request, Ticket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'message'     => 'required|string|max:5000',
            'is_internal' => 'nullable|boolean',
        ]);

        $comment = $ticket->comments()->create([
            'user_id'     => auth()->id(),
            'message'     => $validated['message'],
            'is_internal' => $validated['is_internal'] ?? false,
        ]);

        $comment->load('user:id,name');

        return response()->json($comment, 201);
    }

    /**
     * Supprimer un commentaire.
     */
    public function destroy(Ticket $ticket, TicketComment $comment): JsonResponse
    {
        // Vérifier que le commentaire appartient bien au ticket
        if ($comment->ticket_id !== $ticket->id) {
            return response()->json(['message' => 'Commentaire non trouvé pour ce ticket.'], 404);
        }

        // Seul l'auteur du commentaire ou un admin peut le supprimer
        $user = auth()->user();
        if ($comment->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $comment->delete();

        return response()->json(['message' => 'Commentaire supprimé.']);
    }
}
