import api from './api';
import { Product } from '../context/CRMContext';
import { Customer } from '../context/CRMContext';
import { Lead } from '../context/CRMContext';

export interface QuotationItem {
  id?: number;
  quotation_id?: number;
  product_id?: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  total?: number;
  product?: Product;
}

export interface Quotation {
  id: number;
  number: string;
  title: string;
  description?: string;
  lead_id?: number | null;
  customer_id?: number | null;
  subtotal: number;
  tax_rate: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted';
  valid_until?: string;
  created_at: string;
  updated_at: string;
  items?: QuotationItem[];
  lead?: Lead;
  customer?: Customer;
}

export interface QuotationStats {
  total: number;
  by_status: Record<string, number>;
  conversion_rate: number;
  total_value: number;
  accepted_value: number;
}

export const quotationService = {
  async getQuotations(params?: { status?: string, search?: string, page?: number }) {
    const response = await api.get('/quotations', { params });
    return response.data;
  },

  async getQuotation(id: number) {
    const response = await api.get(`/quotations/${id}`);
    return response.data;
  },

  async createQuotation(data: Partial<Quotation> & { items: QuotationItem[] }) {
    const response = await api.post('/quotations', data);
    return response.data;
  },

  async updateQuotation(id: number, data: Partial<Quotation> & { items: QuotationItem[] }) {
    const response = await api.put(`/quotations/${id}`, data);
    return response.data;
  },

  async deleteQuotation(id: number) {
    const response = await api.delete(`/quotations/${id}`);
    return response.data;
  },

  async sendQuotation(id: number) {
    const response = await api.post(`/quotations/${id}/send`);
    return response.data;
  },

  async updateStatus(id: number, status: 'accepted' | 'rejected') {
    const response = await api.put(`/quotations/${id}/status`, { status });
    return response.data;
  },

  async convertToTransaction(id: number) {
    const response = await api.post(`/quotations/${id}/convert`);
    return response.data;
  },

  async downloadPdf(id: number) {
    const response = await api.get(`/quotations/${id}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `quotation-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  async getStats(): Promise<QuotationStats> {
    const response = await api.get('/quotations/stats');
    return response.data;
  }
};
