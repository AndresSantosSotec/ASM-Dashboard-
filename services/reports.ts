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

export interface LeadDetail {
  id: number
  nombre: string
  email: string
  telefono: string
  estado: string
  programa: string
  ciudad: string
  pais: string
  origen: string
  fecha_captura: string
  fecha_actualizacion: string
  asesor: string
  asesor_id: number
  total_interacciones: number
  dias_desde_captura: number
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
 * 📊 NUEVO: Obtener detalle de leads por asesor
 */
export const getLeadsByAdvisorDetail = async (filters?: ReportFilters): Promise<LeadDetail[]> => {
  try {
    const res = await api.get('/reports/leads-by-advisor-detail', { params: filters })
    return res.data
  } catch (error) {
    console.error('Error fetching leads by advisor detail:', error)
    throw error
  }
}

/**
 * Exportar reporte a PDF/Excel/CSV
 */
export const exportReport = async (
  reportType: string,
  format: 'pdf' | 'xlsx' | 'csv',
  filters?: ReportFilters
): Promise<Blob> => {
  try {
    const res = await api.post('/reports/export-report', {
      reportType,
      ...filters,
      format
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
 * Exportar datos de asesores a Excel/CSV (local)
 */
export const exportAdvisorStatsLocal = (
  data: AdvisorStats[],
  format: 'xlsx' | 'csv',
  userInfo?: { name: string; email: string }
) => {
  const headers = [
    'Asesor',
    'Total Leads',
    'Asignados',
    'Contactados',
    'Convertidos',
    'Tasa Conversión (%)',
    'Interacciones',
    'Promedio Interacciones por Lead'
  ]
  
  const rows = data.map(advisor => [
    advisor.advisor_name,
    advisor.total_leads,
    advisor.leads_asignados,
    advisor.leads_contactados,
    advisor.leads_convertidos,
    advisor.tasa_conversion.toFixed(2),
    advisor.interacciones_total,
    advisor.total_leads > 0 ? (advisor.interacciones_total / advisor.total_leads).toFixed(2) : '0'
  ])

  if (format === 'csv') {
    return exportToCSV([headers, ...rows], 'reporte_rendimiento_asesores', userInfo)
  } else {
    return exportToExcel([headers, ...rows], 'reporte_rendimiento_asesores', 'Rendimiento Asesores', userInfo)
  }
}

/**
 * Exportar estadísticas de leads a CSV/Excel
 */
export const exportLeadStatsLocal = (
  data: LeadStats,
  format: 'xlsx' | 'csv',
  userInfo?: { name: string; email: string }
) => {
  // Resumen general
  const summaryHeaders = ['Métrica', 'Cantidad', 'Porcentaje']
  const total = data.total || 1 // Evitar división por cero
  
  const summaryRows = [
    ['Total de Leads', data.total, '100%'],
    ['Nuevos', data.nuevos, `${((data.nuevos / total) * 100).toFixed(2)}%`],
    ['En Seguimiento', data.en_seguimiento, `${((data.en_seguimiento / total) * 100).toFixed(2)}%`],
    ['Contactados', data.contactados, `${((data.contactados / total) * 100).toFixed(2)}%`],
    ['Convertidos', data.convertidos, `${((data.convertidos / total) * 100).toFixed(2)}%`],
    ['No Interesados', data.no_interesados, `${((data.no_interesados / total) * 100).toFixed(2)}%`]
  ]

  // Por programa
  let allRows = [...summaryRows]
  
  if (data.por_programa && data.por_programa.length > 0) {
    allRows.push(['', '', '']) // Línea vacía
    allRows.push(['DISTRIBUCIÓN POR PROGRAMA', '', ''])
    allRows.push(['Programa', 'Cantidad', 'Porcentaje'])
    
    data.por_programa.forEach(item => {
      allRows.push([
        item.programa,
        item.cantidad,
        `${((item.cantidad / total) * 100).toFixed(2)}%`
      ])
    })
  }

  if (format === 'csv') {
    return exportToCSV(allRows, 'reporte_estadisticas_leads', userInfo)
  } else {
    return exportToExcel(allRows, 'reporte_estadisticas_leads', 'Estadísticas Leads', userInfo)
  }
}

/**
 * Exportar conversiones a CSV/Excel
 */
export const exportConversionStatsLocal = (
  data: ConversionStats,
  format: 'xlsx' | 'csv',
  userInfo?: { name: string; email: string }
) => {
  // Resumen general
  const summaryRows = [
    ['RESUMEN DE CONVERSIONES', '', '', ''],
    ['Total Prospectos', data.total_prospectos, '', ''],
    ['Total Convertidos', data.total_convertidos, '', ''],
    ['Tasa de Conversión', `${data.tasa_conversion.toFixed(2)}%`, '', ''],
    ['', '', '', '']
  ]

  // Por programa
  const programHeaders = ['Programa', 'Prospectos', 'Convertidos', 'Tasa de Conversión (%)']
  const programRows = data.por_programa.map(item => [
    item.programa,
    item.prospectos,
    item.convertidos,
    item.tasa.toFixed(2)
  ])

  const allRows = [...summaryRows, programHeaders, ...programRows]

  if (format === 'csv') {
    return exportToCSV(allRows, 'reporte_conversiones', userInfo)
  } else {
    return exportToExcel(allRows, 'reporte_conversiones', 'Conversiones', userInfo)
  }
}

/**
 * 📊 NUEVO: Exportar detalle de leads por asesor (para Power BI/Excel)
 */
export const exportLeadsByAdvisorDetail = (
  data: LeadDetail[],
  format: 'xlsx' | 'csv',
  userInfo?: { name: string; email: string }
) => {
  const headers = [
    'ID',
    'Nombre Completo',
    'Email',
    'Teléfono',
    'Estado',
    'Programa de Interés',
    'Ciudad',
    'País',
    'Origen',
    'Fecha de Captura',
    'Fecha Última Actualización',
    'Asesor Asignado',
    'ID Asesor',
    'Total Interacciones',
    'Días desde Captura'
  ]
  
  const rows = data.map(lead => [
    lead.id,
    lead.nombre,
    lead.email,
    lead.telefono,
    lead.estado,
    lead.programa,
    lead.ciudad,
    lead.pais,
    lead.origen,
    lead.fecha_captura,
    lead.fecha_actualizacion,
    lead.asesor,
    lead.asesor_id,
    lead.total_interacciones,
    lead.dias_desde_captura
  ])

  if (format === 'csv') {
    return exportToCSV([headers, ...rows], 'detalle_leads_por_asesor', userInfo)
  } else {
    return exportToExcel([headers, ...rows], 'detalle_leads_por_asesor', 'Detalle Leads por Asesor', userInfo)
  }
}

/**
 * Exportar a CSV
 */
const exportToCSV = (
  data: any[][],
  filename: string,
  userInfo?: { name: string; email: string }
) => {
  let csvContent = ''
  
  // Agregar información del usuario si está disponible
  if (userInfo) {
    csvContent += `Generado por: ${userInfo.name}\n`
    csvContent += `Email: ${userInfo.email}\n`
    csvContent += `Fecha: ${new Date().toLocaleString('es-ES')}\n\n`
  }
  
  // Agregar datos
  csvContent += data.map(row => row.join(',')).join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Exportar a Excel (usando SheetJS/XLSX)
 */
const exportToExcel = (
  data: any[][],
  filename: string,
  sheetName: string,
  userInfo?: { name: string; email: string }
) => {
  // Nota: Requiere instalar xlsx: npm install xlsx
  // Por ahora, exportar como CSV con indicación de que puede abrirse en Excel
  return exportToCSV(data, filename, userInfo)
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
