// services/mantenimientos.ts

import api from './api';
import { CuotasDashboardResponse } from '@/types/cuotas';

export interface CuotasDashboardFilters {
  limit?: number;
  search?: string;
  programa_id?: number;
  prospecto_id?: number;
}

/**
 * Fetches the cuotas dashboard data with optional filters
 * @param filters - Optional filters for the dashboard
 * @returns Promise with the dashboard response
 */
export const getCuotasDashboard = async (
  filters?: CuotasDashboardFilters
): Promise<CuotasDashboardResponse> => {
  const params: Record<string, string> = {};
  
  if (filters?.limit) params.limit = filters.limit.toString();
  if (filters?.search && filters.search.trim() !== '') {
    params.search = filters.search.trim();
  }
  if (filters?.programa_id) params.programa_id = filters.programa_id.toString();
  if (filters?.prospecto_id) params.prospecto_id = filters.prospecto_id.toString();

  const response = await api.get<CuotasDashboardResponse>(
    '/mantenimientos/cuotas/dashboard',
    { params }
  );

  return response.data;
};
