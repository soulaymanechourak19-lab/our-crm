import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api';

// Types
export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'agent_commercial' | 'agent_sav';
}

export interface Lead {
    id: number;
    company_name: string;
    contact_name: string;
    email: string;
    phone?: string;
    status: 'new' | 'contacted' | 'qualified' | 'converted';
    created_by: number;
    created_at: string;
    creator?: User;
}

export interface Customer {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    loyalty_score: number;
    tier?: 'Bronze' | 'Silver' | 'Gold';
    converted_from_lead_id?: number;
    lead?: Lead;
    interactions?: Interaction[];
}

export interface Interaction {
    id?: number;
    customer_id?: number;
    type: 'call' | 'email' | 'meeting';
    notes: string;
    date: string;
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface CRMContextType {
    // Auth
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    // Leads
    leads: Lead[];
    leadsPagination: PaginationMeta;
    leadsLoading: boolean;
    fetchLeads: (page?: number, filters?: { status?: string; search?: string }) => Promise<void>;
    addLead: (lead: Partial<Lead>) => Promise<void>;
    updateLead: (id: number, lead: Partial<Lead>) => Promise<void>;
    updateLeadStatus: (id: number, status: string) => Promise<void>;
    deleteLead: (id: number) => Promise<void>;
    convertLead: (id: number) => Promise<void>;
    // Customers
    customers: Customer[];
    customersPagination: PaginationMeta;
    customersLoading: boolean;
    fetchCustomers: (page?: number, filters?: { search?: string; tier?: string }) => Promise<void>;
    addCustomer: (customer: Partial<Customer>) => Promise<void>;
    updateCustomer: (id: number, customer: Partial<Customer>) => Promise<void>;
    deleteCustomer: (id: number) => Promise<void>;
    // Customer detail
    selectedCustomer: Customer | null;
    fetchCustomerDetail: (id: number) => Promise<void>;
    // Interactions
    addInteraction: (customerId: number, interaction: Interaction) => Promise<void>;
    fetchInteractions: (customerId: number, page?: number) => Promise<{ data: Interaction[]; meta: PaginationMeta }>;
    // UI
    error: string | null;
    clearError: () => void;
    toast: { message: string; type: 'success' | 'error' } | null;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const defaultPagination: PaginationMeta = { current_page: 1, last_page: 1, per_page: 15, total: 0 };

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [leadsPagination, setLeadsPagination] = useState<PaginationMeta>(defaultPagination);
    const [leadsLoading, setLeadsLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customersPagination, setCustomersPagination] = useState<PaginationMeta>(defaultPagination);
    const [customersLoading, setCustomersLoading] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const clearError = () => setError(null);

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    // ─── Leads ───────────────────────────────────────────────────────

    const fetchLeads = useCallback(async (page = 1, filters: { status?: string; search?: string } = {}) => {
        setLeadsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            if (filters.status) params.set('status', filters.status);
            if (filters.search) params.set('search', filters.search);

            const data = await apiRequest<any>(`/leads?${params.toString()}`);
            setLeads(data.data || []);
            setLeadsPagination({
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                per_page: data.per_page || 15,
                total: data.total || 0,
            });
        } catch (err: any) {
            setError(err.message);
            // Fallback to empty if forbidden (agent_sav)
            setLeads([]);
        } finally {
            setLeadsLoading(false);
        }
    }, []);

    const addLead = async (lead: Partial<Lead>) => {
        try {
            await apiRequest('/leads', { method: 'POST', body: lead });
            showToast('Lead created successfully', 'success');
            await fetchLeads();
        } catch (err: any) {
            showToast(err.message, 'error');
            throw err;
        }
    };

    const updateLead = async (id: number, data: Partial<Lead>) => {
        try {
            await apiRequest(`/leads/${id}`, { method: 'PUT', body: data });
            showToast('Lead updated successfully', 'success');
            await fetchLeads(leadsPagination.current_page);
        } catch (err: any) {
            showToast(err.message, 'error');
            throw err;
        }
    };

    const updateLeadStatus = async (id: number, status: string) => {
        try {
            await apiRequest(`/leads/${id}/status`, { method: 'PUT', body: { status } });
            showToast('Lead status updated', 'success');
            await fetchLeads(leadsPagination.current_page);
        } catch (err: any) {
            showToast(err.message, 'error');
            throw err;
        }
    };

    const deleteLead = async (id: number) => {
        try {
            await apiRequest(`/leads/${id}`, { method: 'DELETE' });
            showToast('Lead deleted', 'success');
            await fetchLeads(leadsPagination.current_page);
        } catch (err: any) {
            showToast(err.message, 'error');
            throw err;
        }
    };

    const convertLead = async (id: number) => {
        try {
            await apiRequest(`/leads/${id}/convert`, { method: 'POST' });
            showToast('Lead converted to customer!', 'success');
            await fetchLeads(leadsPagination.current_page);
        } catch (err: any) {
            showToast(err.message, 'error');
            throw err;
        }
    };

    // ─── Customers ───────────────────────────────────────────────────

    const fetchCustomers = useCallback(async (page = 1, filters: { search?: string; tier?: string } = {}) => {
        setCustomersLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            if (filters.search) params.set('search', filters.search);
            if (filters.tier) params.set('tier', filters.tier);

            const data = await apiRequest<any>(`/customers?${params.toString()}`);
            setCustomers(data.data || []);
            setCustomersPagination({
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                per_page: data.per_page || 15,
                total: data.total || 0,
            });
        } catch (err: any) {
            setError(err.message);
            setCustomers([]);
        } finally {
            setCustomersLoading(false);
        }
    }, []);

    const addCustomer = async (customer: Partial<Customer>) => {
        try {
            await apiRequest('/customers', { method: 'POST', body: customer });
            showToast('Customer created successfully', 'success');
            await fetchCustomers();
        } catch (err: any) {
            showToast(err.message, 'error');
            throw err;
        }
    };

    const updateCustomer = async (id: number, data: Partial<Customer>) => {
        try {
            await apiRequest(`/customers/${id}`, { method: 'PUT', body: data });
            showToast('Customer updated successfully', 'success');
            await fetchCustomers(customersPagination.current_page);
        } catch (err: any) {
            showToast(err.message, 'error');
            throw err;
        }
    };

    const deleteCustomer = async (id: number) => {
        try {
            await apiRequest(`/customers/${id}`, { method: 'DELETE' });
            showToast('Customer deleted', 'success');
            await fetchCustomers(customersPagination.current_page);
        } catch (err: any) {
            showToast(err.message, 'error');
            throw err;
        }
    };

    const fetchCustomerDetail = async (id: number) => {
        try {
            const data = await apiRequest<Customer>(`/customers/${id}`);
            setSelectedCustomer(data);
        } catch (err: any) {
            setError(err.message);
        }
    };

    // ─── Interactions ────────────────────────────────────────────────

    const addInteraction = async (customerId: number, interaction: Interaction) => {
        try {
            await apiRequest(`/customers/${customerId}/interactions`, {
                method: 'POST',
                body: interaction,
            });
            showToast('Interaction logged successfully', 'success');
            // Refresh customer detail to get updated loyalty score
            await fetchCustomerDetail(customerId);
        } catch (err: any) {
            showToast(err.message, 'error');
            throw err;
        }
    };

    const fetchInteractions = async (customerId: number, page = 1) => {
        const data = await apiRequest<any>(`/customers/${customerId}/interactions?page=${page}`);
        return {
            data: data.data || [],
            meta: {
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                per_page: data.per_page || 10,
                total: data.total || 0,
            },
        };
    };

    // ─── Load user on mount ──────────────────────────────────────────

    useEffect(() => {
        const loadUser = async () => {
            try {
                const user = await apiRequest<User>('/user');
                setCurrentUser(user);
            } catch {
                // Not authenticated
            }
        };
        loadUser();
    }, []);

    return (
        <CRMContext.Provider value={{
            currentUser, setCurrentUser,
            leads, leadsPagination, leadsLoading,
            fetchLeads, addLead, updateLead, updateLeadStatus, deleteLead, convertLead,
            customers, customersPagination, customersLoading,
            fetchCustomers, addCustomer, updateCustomer, deleteCustomer,
            selectedCustomer, fetchCustomerDetail,
            addInteraction, fetchInteractions,
            error, clearError,
            toast, showToast,
        }}>
            {children}
        </CRMContext.Provider>
    );
};

export const useCRM = () => {
    const context = useContext(CRMContext);
    if (!context) throw new Error('useCRM must be used within a CRMProvider');
    return context;
};
