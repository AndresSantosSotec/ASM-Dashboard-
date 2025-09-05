import { api } from './api';

export interface Beneficiary {
  id?: string;
  ccodaho: string;
  alias: string;
  account_type: 'savings' | 'current' | 'credit';
  bank_name?: string;
  account_holder?: string;
  is_own_account?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AddBeneficiaryPayload {
  ccodaho: string;
  alias: string;
  account_type: 'savings' | 'current' | 'credit';
  bank_name?: string;
  account_holder?: string;
}

// Service for managing beneficiaries
export class BeneficiariesService {
  
  // Get all beneficiaries
  static async getBeneficiaries(): Promise<Beneficiary[]> {
    try {
      console.log('[API] Fetching beneficiaries...');
      const response = await api.get('/me/beneficiarios');
      console.log('[API] Beneficiaries fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[API] Error fetching beneficiaries:', error);
      console.error('[API] Error details:', {
        code: error.code,
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw error;
    }
  }

  // Add a new beneficiary
  static async addBeneficiary(payload: AddBeneficiaryPayload): Promise<Beneficiary> {
    try {
      console.log('[API] addBeneficiary payload:', payload);
      
      // Check if token exists
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      console.log('[API] addBeneficiary token:', token);
      console.log('[API] addBeneficiary endpoint: /me/beneficiarios');

      // Health check to verify network connectivity
      try {
        await api.get('/health');
        console.log('[API] Health check passed');
      } catch (healthError: any) {
        console.log('[API] Health check failed:', healthError.message);
        console.warn('[API] Network connectivity check failed');
      }

      if (!token) {
        console.log('[API] Request without token:', { method: 'post', url: '/me/beneficiarios' });
      }

      const response = await api.post('/me/beneficiarios', payload);
      console.log('[API] Beneficiary added successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[API] Response error:', {
        code: error.code,
        data: error.response?.data,
        message: error.message,
        method: 'post',
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: '/me/beneficiarios'
      });
      
      console.error('[API] addBeneficiary error details:', {
        code: error.code,
        config: error.config,
        data: error.response?.data,
        headers: error.response?.headers,
        isNetworkError: error.isAxiosError && !error.response,
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        userMessage: error.userMessage,
      });
      
      console.error('Error adding beneficiary:', error);
      throw error;
    }
  }

  // Update a beneficiary
  static async updateBeneficiary(id: string, payload: Partial<AddBeneficiaryPayload>): Promise<Beneficiary> {
    try {
      console.log('[API] Updating beneficiary:', id, payload);
      const response = await api.put(`/me/beneficiarios/${id}`, payload);
      console.log('[API] Beneficiary updated successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[API] Error updating beneficiary:', error);
      throw error;
    }
  }

  // Delete a beneficiary
  static async deleteBeneficiary(id: string): Promise<void> {
    try {
      console.log('[API] Deleting beneficiary:', id);
      await api.delete(`/me/beneficiarios/${id}`);
      console.log('[API] Beneficiary deleted successfully');
    } catch (error: any) {
      console.error('[API] Error deleting beneficiary:', error);
      throw error;
    }
  }

  // Get own accounts (accounts belonging to the user)
  static async getOwnAccounts(): Promise<Beneficiary[]> {
    try {
      console.log('[API] Fetching own accounts...');
      const response = await api.get('/me/accounts');
      console.log('[API] Own accounts fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[API] Error fetching own accounts:', error);
      throw error;
    }
  }
}