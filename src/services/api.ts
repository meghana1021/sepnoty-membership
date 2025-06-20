import axios from 'axios';
import { Form, FormResponse } from '../types/form';

const API_BASE_URL = 'https://sepnoty-membership-1.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Forms
  async getForms(): Promise<Form[]> {
    const response = await api.get('/forms');
    return response.data;
  },

  async getForm(id: string): Promise<Form> {
    const response = await api.get(`/forms/${id}`);
    return response.data;
  },

  async createForm(form: Omit<Form, 'id' | 'createdAt' | 'responses'>): Promise<Form> {
    const response = await api.post('/forms', form);
    return response.data;
  },

  async updateForm(id: string, form: Omit<Form, 'id' | 'createdAt' | 'responses'>): Promise<Form> {
    const response = await api.put(`/forms/${id}`, form);
    return response.data;
  },

  async deleteForm(id: string): Promise<void> {
    await api.delete(`/forms/${id}`);
  },

  // Responses
  async getFormResponses(formId: string): Promise<FormResponse[]> {
    const response = await api.get(`/forms/${formId}/responses`);
    return response.data;
  },

  async getAllResponses(): Promise<(FormResponse & { formTitle: string })[]> {
    const response = await api.get('/responses');
    return response.data;
  },

  async submitResponse(
    formId: string, 
    data: {
      answers: Record<string, any>;
      submitterName?: string;
      submitterEmail?: string;
    }
  ): Promise<FormResponse> {
    const response = await api.post(`/forms/${formId}/responses`, data);
    return response.data;
  },

  // Dashboard
  async getDashboardStats(): Promise<{
    totalForms: number;
    totalResponses: number;
    avgResponsesPerForm: string;
    recentResponses: (FormResponse & { formTitle: string })[];
  }> {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  // Export
  async exportFormResponses(formId: string): Promise<Blob> {
    const response = await api.get(`/forms/${formId}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await api.get('/health');
    return response.data;
  },
};