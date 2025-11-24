import useSWR from "swr"
import api from "@/services/api"
import type { FilterValues } from "@/components/dashboard/DashboardFilters"

export interface MetricsData {
  // Métricas Financieras
  ingresosMensuales: number
  ingresosMesAnterior: number
  tasaMorosidad: number
  tasaMorosidadAnterior: number
  recaudacionPendiente: number
  recaudacionPendienteAnterior: number
  totalFacturado: number
  totalPagado: number
  totalPendiente: number
  
  // Métricas Académicas (Moodle)
  estudiantesActivos: number
  estudiantesActivosAnterior: number
  nuevasInscripciones: number
  estudiantesInactivos: number
  cursosActivos: number
  estudiantesConActividad: number
  
  // Variaciones
  variaciones: {
    ingresos: number
    morosidad: number
    recaudacion: number
    estudiantes: number
  }
  timestamp: string
}

interface MetricsResponse {
  success: boolean
  data: MetricsData
  filters: FilterValues
}

/**
 * Hook para obtener métricas del dashboard con caché y revalidación automática
 */
export function useMetrics(filters: FilterValues) {
  const buildQueryString = (params: FilterValues) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, value.toString())
      }
    })
    return query.toString()
  }

  const queryString = buildQueryString(filters)
  const key = queryString ? `/dashboard/metrics?${queryString}` : `/dashboard/metrics`

  const fetcher = async (url: string) => {
    const response = await api.get<MetricsResponse>(url)
    return response.data
  }

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // No duplicar requests en 1 minuto
    refreshInterval: 300000, // Refrescar cada 5 minutos
    errorRetryCount: 3,
    errorRetryInterval: 5000,
  })

  return {
    metrics: data?.data,
    filters: data?.filters,
    isLoading,
    isError: error,
    refresh: mutate,
  }
}

/**
 * Hook para obtener métricas por programa
 */
export function useMetricsByPrograma(filters: Omit<FilterValues, "programa_id">) {
  const buildQueryString = (params: FilterValues) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, value.toString())
      }
    })
    return query.toString()
  }

  const queryString = buildQueryString(filters)
  const key = queryString ? `/dashboard/metrics/by-programa?${queryString}` : `/dashboard/metrics/by-programa`

  const fetcher = async (url: string) => {
    const response = await api.get<{
      success: boolean
      data: Array<{
        programa_id: number
        programa_nombre: string
        metricas: MetricsData
      }>
      filters: FilterValues
    }>(url)
    return response.data
  }

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    refreshInterval: 300000,
  })

  return {
    programas: data?.data,
    filters: data?.filters,
    isLoading,
    isError: error,
    refresh: mutate,
  }
}

/**
 * Hook para obtener comparación mensual (últimos 12 meses)
 */
export function useMonthlyComparison() {
  const key = "/dashboard/metrics/monthly-comparison"

  const fetcher = async (url: string) => {
    const response = await api.get<{
      success: boolean
      data: Array<{
        month: number
        year: number
        month_name: string
        metricas: MetricsData
      }>
    }>(url)
    return response.data
  }

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutos
    refreshInterval: 600000, // 10 minutos
  })

  return {
    months: data?.data,
    isLoading,
    isError: error,
    refresh: mutate,
  }
}

/**
 * Función para limpiar el caché de métricas en el servidor
 */
export async function clearMetricsCache() {
  try {
    await api.post("/dashboard/metrics/clear-cache")
    return { success: true }
  } catch (error) {
    console.error("Error limpiando cache:", error)
    return { success: false, error }
  }
}
