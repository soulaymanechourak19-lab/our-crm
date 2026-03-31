import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { quotationService, Quotation } from '../services/quotationService';
import { discountService, Discount } from '../services/discountService';
import { useNotification } from './NotificationContext';

// Types
export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'agent_commercial' | 'agent_sav';
}

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    is_active: boolean;
}

export interface Lead {
    id: number;
    company_name: string;
    contact_name: string;
    email: string;
    phone?: string;
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'hot' | 'expired';
    source?: 'website' | 'referral' | 'event' | 'manual' | 'nearby';
    expires_at?: string;
    expired?: boolean;
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
    fetchLeads: (page?: number, filters?: { status?: string; search?: string; per_page?: number }) => Promise<void>;
    addLead: (lead: Partial<Lead>) => Promise<boolean>;
    updateLead: (id: number, lead: Partial<Lead>) => Promise<boolean>;
    updateLeadStatus: (id: number, status: string) => Promise<boolean>;
    deleteLead: (id: number) => Promise<boolean>;
    convertLead: (id: number) => Promise<boolean>;
    // Customers
    customers: Customer[];
    customersPagination: PaginationMeta;
    customersLoading: boolean;
    fetchCustomers: (page?: number, filters?: { search?: string; tier?: string; per_page?: number }) => Promise<void>;
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
    
    // Quotations
    quotations: Quotation[];
    quotationsPagination: PaginationMeta;
    quotationsLoading: boolean;
    fetchQuotations: (page?: number, filters?: { status?: string; search?: string }) => Promise<void>;
    
    // Discounts
    discounts: Discount[];
    discountsPagination: PaginationMeta;
    discountsLoading: boolean;
    fetchDiscounts: (page?: number, filters?: { active?: boolean; search?: string }) => Promise<void>;
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

    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [quotationsPagination, setQuotationsPagination] = useState<PaginationMeta>(defaultPagination);
    const [quotationsLoading, setQuotationsLoading] = useState(false);

    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [discountsPagination, setDiscountsPagination] = useState<PaginationMeta>(defaultPagination);
    const [discountsLoading, setDiscountsLoading] = useState(false);

    const { addNotification } = useNotification();

    const clearError = () => setError(null);

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    // ─── Leads ───────────────────────────────────────────────────────

    const fetchLeads = useCallback(async (page = 1, filters: { status?: string; search?: string; per_page?: number } = {}) => {
        setLeadsLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.set('page', String(page));
        if (filters.status) params.set('status', filters.status);
        if (filters.search) params.set('search', filters.search);
        if (filters.per_page) params.set('per_page', String(filters.per_page));

        try {
            const { data } = await api.get(`/leads?${params.toString()}`);
            setLeads(data.data || []);
            setLeadsPagination({
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                per_page: data.per_page || 15,
                total: data.total || 0,
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch leads');
            setLeads([]);
        }
        setLeadsLoading(false);
    }, []);

    const addLead = async (lead: Partial<Lead>) => {
        try {
            const { data } = await api.post('/leads', lead);
            showToast('Lead created successfully', 'success');
            addNotification('success', 'New Lead Added', `${lead.company_name || 'A new lead'} has been created.`);
            await fetchLeads();
            return true;
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to create lead', 'error');
            return false;
        }
    };

    const updateLead = async (id: number, data: Partial<Lead>) => {
        try {
            await api.put(`/leads/${id}`, data);
            showToast('Lead updated successfully', 'success');
            await fetchLeads(leadsPagination.current_page);
            return true;
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to update lead', 'error');
            return false;
        }
    };

    const updateLeadStatus = async (id: number, status: string) => {
        try {
            await api.put(`/leads/${id}/status`, { status });
            showToast('Lead status updated', 'success');
            
            // Find the lead to get its name for the notification
            const lead = leads.find(l => l.id === id);
            addNotification('info', 'Lead Status Changed', `${lead?.company_name || 'Lead'} is now ${status}.`);
            
            await fetchLeads(leadsPagination.current_page);
            return true;
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to update status', 'error');
            return false;
        }
    };

    const deleteLead = async (id: number) => {
        try {
            await api.delete(`/leads/${id}`);
            showToast('Lead deleted', 'success');
            await fetchLeads(leadsPagination.current_page);
            return true;
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to delete lead', 'error');
            return false;
        }
    };

    const convertLead = async (id: number) => {
        try {
            await api.post(`/leads/${id}/convert`);
            showToast('Lead converted to customer!', 'success');
            addNotification('success', 'Lead Converted', `Successfully converted lead to customer.`);
            await fetchLeads(leadsPagination.current_page);
            return true;
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to convert lead', 'error');
            return false;
        }
    };

    // ─── Customers ───────────────────────────────────────────────────

    const fetchCustomers = useCallback(async (page = 1, filters: { search?: string; tier?: string; per_page?: number } = {}) => {
        setCustomersLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.set('page', String(page));
        if (filters.search) params.set('search', filters.search);
        if (filters.tier) params.set('tier', filters.tier);
        if (filters.per_page) params.set('per_page', String(filters.per_page));

        try {
            const { data } = await api.get(`/customers?${params.toString()}`);
            setCustomers(data.data || []);
            setCustomersPagination({
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                per_page: data.per_page || 15,
                total: data.total || 0,
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch customers');
            setCustomers([]);
        }
        setCustomersLoading(false);
    }, []);

    const addCustomer = async (customer: Partial<Customer>) => {
        try {
            await api.post('/customers', customer);
            showToast('Customer created successfully', 'success');
            addNotification('success', 'New Customer', `${customer.name || 'A new customer'} has been added.`);
            await fetchCustomers();
            return true;
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to create customer', 'error');
            return false;
        }
    };

    const updateCustomer = async (id: number, data: Partial<Customer>) => {
        try {
            await api.put(`/customers/${id}`, data);
            showToast('Customer updated successfully', 'success');
            await fetchCustomers(customersPagination.current_page);
            return true;
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to update customer', 'error');
            return false;
        }
    };

    const deleteCustomer = async (id: number) => {
        try {
            await api.delete(`/customers/${id}`);
            showToast('Customer deleted', 'success');
            await fetchCustomers(customersPagination.current_page);
            return true;
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to delete customer', 'error');
            return false;
        }
    };

    const fetchCustomerDetail = async (id: number) => {
        try {
            const { data } = await api.get(`/customers/${id}`);
            setSelectedCustomer(data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch customer details');
        }
    };

    // ─── Interactions ────────────────────────────────────────────────

    const addInteraction = async (customerId: number, interaction: Interaction) => {
        try {
            await api.post(`/customers/${customerId}/interactions`, interaction);
            showToast('Interaction logged successfully', 'success');
            await fetchCustomerDetail(customerId);
            return true;
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to log interaction', 'error');
            return false;
        }
    };

    const fetchInteractions = async (customerId: number, page = 1) => {
        try {
            const { data } = await api.get(`/customers/${customerId}/interactions?page=${page}`);
            return {
                data: data.data || [],
                meta: {
                    current_page: data.current_page || 1,
                    last_page: data.last_page || 1,
                    per_page: data.per_page || 10,
                    total: data.total || 0,
                },
            };
        } catch {
            return { data: [], meta: defaultPagination };
        }
    };

    // ─── Load user on mount ──────────────────────────────────────────

    useEffect(() => {
        const loadUser = async () => {
            try {
                const { data } = await api.get('/user');
                setCurrentUser(data);
            } catch {
                // Not logged in or session expired
            }
        };
        loadUser();
    }, []);

    // ─── Quotations & Discounts ──────────────────────────────────────

    const fetchQuotations = useCallback(async (page = 1, filters: { status?: string; search?: string } = {}) => {
        setQuotationsLoading(true);
        try {
            const data = await quotationService.getQuotations({ ...filters, page });
            setQuotations(data.data || []);
            setQuotationsPagination({
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                per_page: data.per_page || 15,
                total: data.total || 0,
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch quotations');
        }
        setQuotationsLoading(false);
    }, []);

    const fetchDiscounts = useCallback(async (page = 1, filters: { active?: boolean; search?: string } = {}) => {
        setDiscountsLoading(true);
        try {
            const data = await discountService.getDiscounts({ ...filters, page });
            setDiscounts(data.data || []);
            setDiscountsPagination({
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                per_page: data.per_page || 15,
                total: data.total || 0,
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch discounts');
        }
        setDiscountsLoading(false);
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
            quotations, quotationsPagination, quotationsLoading, fetchQuotations,
            discounts, discountsPagination, discountsLoading, fetchDiscounts
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
