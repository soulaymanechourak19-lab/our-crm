import api from './api';
import { Lead } from '../context/CRMContext';

export interface LeadTrackingEvent {
  id: number;
  session_id: string;
  pages_viewed: string[];
  time_on_site: number;
  entry_page?: string;
  exit_page?: string;
  device_type?: string;
  location?: string;
  score: number;
  last_activity: string;
  created_at: string;
}

export const leadTrackingService = {
  async getTrackingHistory(leadId: number) {
    const response = await api.get(`/leads/${leadId}/tracking`);
    return response.data;
  },

  async extendExpiration(leadId: number, days: number = 30) {
    const response = await api.put(`/leads/${leadId}/extend-expiration`, { days });
    return response.data;
  },

  async getNearbyLeads(lat: number, lng: number, radius: number = 50) {
    const response = await api.get('/leads/nearby', { params: { lat, lng, radius } });
    return response.data;
  }
};
