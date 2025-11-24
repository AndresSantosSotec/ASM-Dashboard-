/**
 * 🎣 CUSTOM HOOK - useFinancialMetrics
 * 
 * Hook para consumir métricas financieras con SWR (cache + revalidación automática)
 */

import useSWR from 'swr';
import {
  getFinancialMetrics,
  getEstudianteFinanciero,
  type FinancialMetrics,
  type EstudianteFinanciero,
  type FinancialMetricsParams,
} from '@/services/financialMetrics';
import { getCurrentMonth, getCurrentYear } from '@/services/financialMetrics';

// =====================================================
// HOOK PRINCIPAL: Métricas Completas
// =====================================================

export function useFinancialMetrics(params?: FinancialMetricsParams) {
  // Usar mes/año actual si no se especifica
  const mes = params?.mes || getCurrentMonth();
  const anio = params?.anio || getCurrentYear();

  const key = params
    ? `/dashboard/financial/metrics?${JSON.stringify({ mes, anio, programa_id: params.programa_id })}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<FinancialMetrics>(
    key,
    () => getFinancialMetrics({ ...params, mes, anio }),
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      // Revalidar cada 2 minutos (coincide con backend cache)
      refreshInterval: 120000,
      // No revalidar en modo auditoría
      refreshWhenHidden: !params?.auditoria,
    }
  );

  return {
    metrics: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// =====================================================
// HOOK: Estado Financiero Individual
// =====================================================

export function useEstudianteFinanciero(
  carnet: string | null,
  mes?: number,
  anio?: number
) {
  const mesActual = mes || getCurrentMonth();
  const anioActual = anio || getCurrentYear();

  const key = carnet
    ? `/dashboard/financial/estudiante/${carnet}?mes=${mesActual}&anio=${anioActual}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<EstudianteFinanciero>(
    key,
    () => getEstudianteFinanciero(carnet!, mesActual, anioActual),
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 5000, // 5 segundos
    }
  );

  return {
    estudiante: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// =====================================================
// HOOK: Filtros de Dashboard
// =====================================================

export function useFinancialFilters() {
  const currentMonth = getCurrentMonth();
  const currentYear = getCurrentYear();

  // Estado de filtros (puedes usar useState si necesitas persistencia)
  const getDefaultFilters = () => ({
    mes: currentMonth,
    anio: currentYear,
    programa_id: undefined as number | undefined,
    auditoria: false,
  });

  return {
    defaultFilters: getDefaultFilters(),
    currentMonth,
    currentYear,
  };
}
