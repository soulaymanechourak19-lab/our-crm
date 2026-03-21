import api from './api';

export interface Discount {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description?: string;
  starts_at?: string;
  expires_at?: string;
  max_uses?: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export interface CustomerDiscount {
  id: number;
  customer_id: number;
  discount_id: number;
  applied_at?: string;
  order_id?: number;
  discount?: Discount;
  created_at: string;
}

export const discountService = {
  async getDiscounts(params?: { active?: boolean, search?: string, page?: number }) {
    const response = await api.get('/discounts', { params });
    return response.data;
  },

  async createDiscount(data: Partial<Discount>) {
    const response = await api.post('/discounts', data);
    return response.data;
  },

  async updateDiscount(id: number, data: Partial<Discount>) {
    const response = await api.put(`/discounts/${id}`, data);
    return response.data;
  },

  async deleteDiscount(id: number) {
    const response = await api.delete(`/discounts/${id}`);
    return response.data;
  },

  async validateCode(code: string) {
    const response = await api.post('/discounts/validate', { code });
    return response.data;
  },

  async getCustomerDiscounts(customerId: number) {
    const response = await api.get(`/customers/${customerId}/discounts`);
    return response.data;
  }
};
