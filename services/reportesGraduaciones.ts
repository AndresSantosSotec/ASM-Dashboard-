import api from "./api"

// ============================================
// TIPOS DE DATOS
// ============================================

export interface GraduacionFiltros {
  anio: number
  periodo: 'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4'
  programaId: string
  search?: string
  rangoFechas: {
    fechaInicio: string
    fechaFin: string
    descripcion: string
  }
}

export interface Graduado {
  id: number
  prospectoId: number
  nombre: string
  carnet: string
  identificacion: string
  programa: string
  programaAbreviatura: string
  fechaInicio: string
  fechaGraduacion: string
  duracionMeses: number
  correo: string
  telefono: string
  modalidad: string
  asesor: string
}

export interface PaginacionGraduados {
  paginaActual: number
  registrosPorPagina: number
  total: number
  totalPaginas: number
}

export interface GraduadosResponse {
  graduados: Graduado[]
  paginacion: PaginacionGraduados
}

export interface DistribucionPrograma {
  programa: string
  abreviatura: string
  total: number
}

export interface DistribucionModalidad {
  modalidad: string
  total: number
}

export interface EstadisticasGraduacion {
  totalGraduados: number
  distribucionProgramas: DistribucionPrograma[]
  distribucionModalidad: DistribucionModalidad[]
  tiempoPromedioMeses: number
}

export interface GraduadosPorMes {
  mes: string
  mesNumero: number
  total: number
}

export interface ComparacionAnioAnterior {
  anioAnterior: number
  totalAnioAnterior: number
  totalAnioActual: number
  variacion: number
}

export interface AnalisisHistorico {
  graduadosPorMes: GraduadosPorMes[]
  comparacionAnioAnterior: ComparacionAnioAnterior
}

export interface SeguimientoEgresados {
  totalEgresados: number
  egresadosContactoCompleto: number
  porcentajeContactoCompleto: number
}

export interface ReportesGraduacionesResponse {
  filtros: GraduacionFiltros
  graduados: GraduadosResponse
  estadisticas: EstadisticasGraduacion
  historico: AnalisisHistorico
  egresados: SeguimientoEgresados
}

export interface ExportGraduacionesParams {
  formato: 'pdf' | 'excel' | 'csv'
  anio?: number
  periodo?: 'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4'
  programaId?: string
  search?: string
}

// ============================================
// FUNCIONES DE API
// ============================================

/**
 * Obtener reportes de graduaciones con filtros
 */
export const fetchReportesGraduaciones = async (params: {
  anio?: number
  periodo?: 'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4'
  programaId?: string
  search?: string
  page?: number
  perPage?: number
}): Promise<ReportesGraduacionesResponse> => {
  console.log('📡 API Request to /administracion/reportes-graduaciones', params)
  
  try {
    const response = await api.get('/administracion/reportes-graduaciones', { params })
    console.log('✅ API Response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    })
    throw error
  }
}

/**
 * Exportar reportes de graduaciones
 */
export const exportReportesGraduaciones = async (
  params: ExportGraduacionesParams
): Promise<void> => {
  try {
    const response = await api.post(
      '/administracion/reportes-graduaciones/exportar',
      params,
      {
        responseType: 'blob', // Importante para archivos binarios
      }
    )

    // Determinar el nombre del archivo según el formato
    const extension = params.formato === 'excel' ? 'xlsx' : params.formato
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `reporte-graduaciones-${timestamp}.${extension}`

    // Crear un enlace temporal para descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()

    // Limpiar
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error: any) {
    console.error('Error al exportar reporte de graduaciones:', error)
    
    // Si el error tiene un blob response, intentar leer el mensaje JSON
    if (error.response?.data instanceof Blob) {
      const text = await error.response.data.text()
      try {
        const errorData = JSON.parse(text)
        throw new Error(errorData.message || 'Error al exportar reporte')
      } catch {
        throw new Error('Error al exportar reporte de graduaciones')
      }
    }
    
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Error al exportar reporte de graduaciones'
    )
  }
}

/**
 * Obtener lista de programas disponibles para filtrar
 */
export const fetchProgramasParaFiltro = async (): Promise<Array<{ id: number; nombre: string; abreviatura: string }>> => {
  const response = await api.get('/programas')
  return response.data.data || response.data
}

/**
 * Helper: Obtener años disponibles para el filtro
 */
export const getAniosDisponibles = (): number[] => {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  // Últimos 10 años + próximo año
  for (let i = currentYear + 1; i >= currentYear - 10; i--) {
    years.push(i)
  }
  return years
}

/**
 * Helper: Obtener períodos trimestrales
 */
export const getPeriodosDisponibles = (): Array<{ value: string; label: string }> => {
  return [
    { value: 'all', label: 'Todo el año' },
    { value: 'Q1', label: 'Q1 (Ene-Mar)' },
    { value: 'Q2', label: 'Q2 (Abr-Jun)' },
    { value: 'Q3', label: 'Q3 (Jul-Sep)' },
    { value: 'Q4', label: 'Q4 (Oct-Dic)' },
  ]
}

/**
 * Helper: Formatear fecha a formato local
 */
export const formatFechaGraduacion = (fecha: string): string => {
  if (!fecha) return 'N/A'
  
  try {
    const date = new Date(fecha)
    return date.toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return fecha
  }
}

/**
 * Helper: Calcular tiempo transcurrido desde graduación
 */
export const calcularTiempoDesdeGraduacion = (fechaGraduacion: string): string => {
  if (!fechaGraduacion) return 'N/A'
  
  try {
    const fecha = new Date(fechaGraduacion)
    const ahora = new Date()
    const meses = Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    
    if (meses < 1) return 'Recién graduado'
    if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`
    
    const anios = Math.floor(meses / 12)
    const mesesRestantes = meses % 12
    
    if (mesesRestantes === 0) return `${anios} ${anios === 1 ? 'año' : 'años'}`
    return `${anios} ${anios === 1 ? 'año' : 'años'} y ${mesesRestantes} ${mesesRestantes === 1 ? 'mes' : 'meses'}`
  } catch {
    return 'N/A'
  }
}
