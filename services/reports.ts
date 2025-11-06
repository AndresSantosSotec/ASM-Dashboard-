import api from './api'

// ========== TIPOS ==========
export interface ReportFilters {
  from?: string  // YYYY-MM-DD
  to?: string    // YYYY-MM-DD
  userId?: number
  programId?: number
  status?: string
}

export interface AdvisorStats {
  advisor_id: number
  advisor_name: string
  total_leads: number
  leads_asignados: number
  leads_contactados: number
  leads_convertidos: number
  tasa_conversion: number
  interacciones_total: number
}

export interface LeadStats {
  total: number
  nuevos: number
  en_seguimiento: number
  contactados: number
  convertidos: number
  no_interesados: number
  por_programa: Array<{
    programa: string
    cantidad: number
  }>
}

export interface ConversionStats {
  total_prospectos: number
  total_convertidos: number
  tasa_conversion: number
  por_programa: Array<{
    programa: string
    prospectos: number
    convertidos: number
    tasa: number
  }>
}

export interface IncomeStats {
  total_ingresos: number
  por_programa: Array<{
    programa: string
    ingresos: number
  }>
}

export interface PerformanceStats {
  total_leads: number
  convertidos: number
  tasa_conversion: number
  interacciones_total: number
}

// ========== FUNCIONES DE API ==========

/**
 * Obtener estadísticas de asesores
 */
export const getAdvisorStats = async (filters?: ReportFilters): Promise<AdvisorStats[]> => {
  try {
    const res = await api.get('/reports/advisor-stats', { params: filters })
    return res.data
  } catch (error) {
    console.error('Error fetching advisor stats:', error)
    throw error
  }
}

/**
 * Obtener estadísticas de leads
 */
export const getLeadStats = async (filters?: ReportFilters): Promise<LeadStats> => {
  try {
    const res = await api.get('/reports/lead-stats', { params: filters })
    return res.data
  } catch (error) {
    console.error('Error fetching lead stats:', error)
    throw error
  }
}

/**
 * Obtener estadísticas de conversiones
 */
export const getConversionStats = async (filters?: ReportFilters): Promise<ConversionStats> => {
  try {
    const res = await api.get('/reports/conversion-stats', { params: filters })
    return res.data
  } catch (error) {
    console.error('Error fetching conversion stats:', error)
    throw error
  }
}

/**
 * Obtener estadísticas de ingresos
 */
export const getIncomeStats = async (filters?: ReportFilters): Promise<IncomeStats> => {
  try {
    const res = await api.get('/reports/income-stats', { params: filters })
    return res.data
  } catch (error) {
    console.error('Error fetching income stats:', error)
    throw error
  }
}

/**
 * Obtener rendimiento general
 */
export const getPerformanceStats = async (filters?: ReportFilters): Promise<PerformanceStats> => {
  try {
    const res = await api.get('/reports/performance-stats', { params: filters })
    return res.data
  } catch (error) {
    console.error('Error fetching performance stats:', error)
    throw error
  }
}

/**
 * Exportar reporte a Excel
 */
export const exportReport = async (reportType: string, filters?: ReportFilters): Promise<Blob> => {
  try {
    const res = await api.post('/reports/export-report', {
      reportType,
      ...filters,
      format: 'xlsx'
    }, {
      responseType: 'blob'
    })
    return res.data
  } catch (error) {
    console.error('Error exporting report:', error)
    throw error
  }
}

/**
 * Obtener lista de usuarios/asesores para filtros
 */
export const getAdvisorsForFilter = async (): Promise<Array<{ id: number, name: string }>> => {
  try {
    const res = await api.get('/reports/advisors')
    return res.data
  } catch (error) {
    console.error('Error fetching advisors:', error)
    return []
  }
}

/**
 * Obtener lista de programas para filtros
 */
export const getProgramsForFilter = async (): Promise<Array<{ id: number, nombre: string }>> => {
  try {
    const res = await api.get('/reports/programs')
    return res.data
  } catch (error) {
    console.error('Error fetching programs:', error)
    return []
  }
}
