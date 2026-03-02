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
    addLead: (lead: Partial<Lead>) => Promise<boolean>;
    updateLead: (id: number, lead: Partial<Lead>) => Promise<boolean>;
    updateLeadStatus: (id: number, status: string) => Promise<boolean>;
    deleteLead: (id: number) => Promise<boolean>;
    convertLead: (id: number) => Promise<boolean>;
    // Customers
    customers: Customer[];
    customersPagination: PaginationMeta;
    customersLoading: boolean;
    fetchCustomers: (page?: number, filters?: { search?: string; tier?: string }) => Promise<void>;
    addCustomer: (customer: Partial<Customer>) => Promise<boolean>;
    updateCustomer: (id: number, customer: Partial<Customer>) => Promise<boolean>;
    deleteCustomer: (id: number) => Promise<boolean>;
    // Customer detail
    selectedCustomer: Customer | null;
    fetchCustomerDetail: (id: number) => Promise<void>;
    // Interactions
    addInteraction: (customerId: number, interaction: Interaction) => Promise<boolean>;
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
        const params = new URLSearchParams();
        params.set('page', String(page));
        if (filters.status) params.set('status', filters.status);
        if (filters.search) params.set('search', filters.search);

        const result = await apiRequest<any>(`/leads?${params.toString()}`);
        if (result.ok && result.data) {
            setLeads(result.data.data || []);
            setLeadsPagination({
                current_page: result.data.current_page || 1,
                last_page: result.data.last_page || 1,
                per_page: result.data.per_page || 15,
                total: result.data.total || 0,
            });
        } else {
            setError(result.error);
            setLeads([]);
        }
        setLeadsLoading(false);
    }, []);

    const addLead = async (lead: Partial<Lead>) => {
        const result = await apiRequest('/leads', { method: 'POST', body: lead });
        if (result.ok) {
            showToast('Lead created successfully', 'success');
            await fetchLeads();
            return true;
        } else {
            showToast(result.error || 'Failed to create lead', 'error');
            return false;
        }
    };

    const updateLead = async (id: number, data: Partial<Lead>) => {
        const result = await apiRequest(`/leads/${id}`, { method: 'PUT', body: data });
        if (result.ok) {
            showToast('Lead updated successfully', 'success');
            await fetchLeads(leadsPagination.current_page);
            return true;
        } else {
            showToast(result.error || 'Failed to update lead', 'error');
            return false;
        }
    };

    const updateLeadStatus = async (id: number, status: string) => {
        const result = await apiRequest(`/leads/${id}/status`, { method: 'PUT', body: { status } });
        if (result.ok) {
            showToast('Lead status updated', 'success');
            await fetchLeads(leadsPagination.current_page);
            return true;
        } else {
            showToast(result.error || 'Failed to update status', 'error');
            return false;
        }
    };

    const deleteLead = async (id: number) => {
        const result = await apiRequest(`/leads/${id}`, { method: 'DELETE' });
        if (result.ok) {
            showToast('Lead deleted', 'success');
            await fetchLeads(leadsPagination.current_page);
            return true;
        } else {
            showToast(result.error || 'Failed to delete lead', 'error');
            return false;
        }
    };

    const convertLead = async (id: number) => {
        const result = await apiRequest(`/leads/${id}/convert`, { method: 'POST' });
        if (result.ok) {
            showToast('Lead converted to customer!', 'success');
            await fetchLeads(leadsPagination.current_page);
            return true;
        } else {
            showToast(result.error || 'Failed to convert lead', 'error');
            return false;
        }
    };

    // ─── Customers ───────────────────────────────────────────────────

    const fetchCustomers = useCallback(async (page = 1, filters: { search?: string; tier?: string } = {}) => {
        setCustomersLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.set('page', String(page));
        if (filters.search) params.set('search', filters.search);
        if (filters.tier) params.set('tier', filters.tier);

        const result = await apiRequest<any>(`/customers?${params.toString()}`);
        if (result.ok && result.data) {
            setCustomers(result.data.data || []);
            setCustomersPagination({
                current_page: result.data.current_page || 1,
                last_page: result.data.last_page || 1,
                per_page: result.data.per_page || 15,
                total: result.data.total || 0,
            });
        } else {
            setError(result.error);
            setCustomers([]);
        }
        setCustomersLoading(false);
    }, []);

    const addCustomer = async (customer: Partial<Customer>) => {
        const result = await apiRequest('/customers', { method: 'POST', body: customer });
        if (result.ok) {
            showToast('Customer created successfully', 'success');
            await fetchCustomers();
            return true;
        } else {
            showToast(result.error || 'Failed to create customer', 'error');
            return false;
        }
    };

    const updateCustomer = async (id: number, data: Partial<Customer>) => {
        const result = await apiRequest(`/customers/${id}`, { method: 'PUT', body: data });
        if (result.ok) {
            showToast('Customer updated successfully', 'success');
            await fetchCustomers(customersPagination.current_page);
            return true;
        } else {
            showToast(result.error || 'Failed to update customer', 'error');
            return false;
        }
    };

    const deleteCustomer = async (id: number) => {
        const result = await apiRequest(`/customers/${id}`, { method: 'DELETE' });
        if (result.ok) {
            showToast('Customer deleted', 'success');
            await fetchCustomers(customersPagination.current_page);
            return true;
        } else {
            showToast(result.error || 'Failed to delete customer', 'error');
            return false;
        }
    };

    const fetchCustomerDetail = async (id: number) => {
        const result = await apiRequest<Customer>(`/customers/${id}`);
        if (result.ok && result.data) {
            setSelectedCustomer(result.data);
        } else {
            setError(result.error);
        }
    };

    // ─── Interactions ────────────────────────────────────────────────

    const addInteraction = async (customerId: number, interaction: Interaction) => {
        const result = await apiRequest(`/customers/${customerId}/interactions`, {
            method: 'POST',
            body: interaction,
        });
        if (result.ok) {
            showToast('Interaction logged successfully', 'success');
            // Refresh customer detail to get updated loyalty score
            await fetchCustomerDetail(customerId);
            return true;
        } else {
            showToast(result.error || 'Failed to log interaction', 'error');
            return false;
        }
    };

    const fetchInteractions = async (customerId: number, page = 1) => {
        const result = await apiRequest<any>(`/customers/${customerId}/interactions?page=${page}`);
        if (result.ok && result.data) {
            return {
                data: result.data.data || [],
                meta: {
                    current_page: result.data.current_page || 1,
                    last_page: result.data.last_page || 1,
                    per_page: result.data.per_page || 10,
                    total: result.data.total || 0,
                },
            };
        }
        return { data: [], meta: defaultPagination };
    };

    // ─── Load user on mount ──────────────────────────────────────────

    useEffect(() => {
        const loadUser = async () => {
            const result = await apiRequest<User>('/user');
            if (result.ok && result.data) {
                setCurrentUser(result.data);
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
