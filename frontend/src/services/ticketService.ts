import api from './api';

// ── Types ────────────────────────────────────────────────────────────

export interface Ticket {
    id: number;
    ticket_number: string;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    customer_id: number | null;
    assigned_to: number | null;
    created_by: number | null;
    source: string;
    category: string | null;
    resolved_at: string | null;
    created_at: string;
    updated_at: string;
    customer?: { id: number; name: string; email: string; phone?: string };
    assigned_agent?: { id: number; name: string; email: string };
    creator?: { id: number; name: string };
    comments?: TicketComment[];
    history?: TicketHistory[];
}

export interface TicketComment {
    id: number;
    ticket_id: number;
    user_id: number;
    message: string;
    is_internal: boolean;
    created_at: string;
    user?: { id: number; name: string };
}

export interface TicketHistory {
    id: number;
    ticket_id: number;
    changed_by: number | null;
    field: string;
    old_value: string | null;
    new_value: string | null;
    created_at: string;
    changed_by_user?: { id: number; name: string };
}

export interface TicketStats {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
    by_priority: { low: number; medium: number; high: number; critical: number };
    avg_resolution_hours: number;
    by_agent: { name: string; total: number }[];
    recent_count: number;
}

export interface Agent {
    id: number;
    name: string;
    email: string;
    role: string;
    open_tickets_count: number;
}

// ── API Calls ────────────────────────────────────────────────────────

export const ticketService = {
    // Liste des tickets (paginée, avec filtres)
    getTickets: async (params?: {
        page?: number;
        status?: string;
        priority?: string;
        assigned_to?: string;
        search?: string;
        per_page?: number;
    }) => {
        const query = new URLSearchParams();
        if (params?.page) query.set('page', String(params.page));
        if (params?.status) query.set('status', params.status);
        if (params?.priority) query.set('priority', params.priority);
        if (params?.assigned_to) query.set('assigned_to', params.assigned_to);
        if (params?.search) query.set('search', params.search);
        if (params?.per_page) query.set('per_page', String(params.per_page));
        const { data } = await api.get(`/tickets?${query.toString()}`);
        return data;
    },

    // Détail d'un ticket
    getTicket: async (id: number): Promise<Ticket> => {
        const { data } = await api.get(`/tickets/${id}`);
        return data;
    },

    // Créer un ticket
    createTicket: async (ticket: {
        title: string;
        description: string;
        customer_id?: number | null;
        priority?: string;
        source?: string;
        category?: string;
    }): Promise<Ticket> => {
        const { data } = await api.post('/tickets', ticket);
        return data;
    },

    // Mettre à jour un ticket
    updateTicket: async (id: number, updates: Partial<Ticket>): Promise<Ticket> => {
        const { data } = await api.put(`/tickets/${id}`, updates);
        return data;
    },

    // Changer le statut
    updateStatus: async (id: number, status: string): Promise<Ticket> => {
        const { data } = await api.put(`/tickets/${id}/status`, { status });
        return data;
    },

    // Assigner un agent
    assignTicket: async (id: number, assigned_to: number): Promise<Ticket> => {
        const { data } = await api.put(`/tickets/${id}/assign`, { assigned_to });
        return data;
    },

    // Supprimer
    deleteTicket: async (id: number) => {
        await api.delete(`/tickets/${id}`);
    },

    // Statistiques SAV
    getStats: async (): Promise<TicketStats> => {
        const { data } = await api.get('/tickets/stats');
        return data;
    },

    // Liste des agents SAV
    getAgents: async (): Promise<Agent[]> => {
        const { data } = await api.get('/tickets/agents');
        return data;
    },

    // Commentaires
    getComments: async (ticketId: number): Promise<TicketComment[]> => {
        const { data } = await api.get(`/tickets/${ticketId}/comments`);
        return data;
    },

    addComment: async (ticketId: number, message: string, is_internal: boolean = false): Promise<TicketComment> => {
        const { data } = await api.post(`/tickets/${ticketId}/comments`, { message, is_internal });
        return data;
    },

    deleteComment: async (ticketId: number, commentId: number) => {
        await api.delete(`/tickets/${ticketId}/comments/${commentId}`);
    },

    // Tickets d'un client (pour la fiche client)
    getCustomerTickets: async (customerId: number): Promise<Ticket[]> => {
        const { data } = await api.get(`/customers/${customerId}/tickets`);
        return data;
    },
};

export default ticketService;
