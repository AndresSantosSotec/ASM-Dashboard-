import api from "./api"

export interface MetricChange {
  total?: number | null
  mesAnterior?: number | null
  porcentajeCambio?: number | null
}

export interface UpcomingItem {
  nombre?: string | null
  fecha?: string | null
  fechaInicio?: string | null
  fechaFin?: string | null
  tipo?: string | null
  estado?: string | null
}

export interface DashboardProximosInicios {
  total?: number | null
  cursos?: number | null
  periodos?: number | null
  detalles?: UpcomingItem[]
}

export interface DashboardGraduaciones {
  total?: number | null
  proximoTrimestre?: boolean | null
  detalles?: UpcomingItem[]
}

export interface EvolutionPoint {
  periodo: string
  total: number
  variacion?: number | null
}

export interface ProgramDistribution {
  programa: string
  abreviatura: string
  totalEstudiantes: number
  porcentaje?: number | null
}

export interface NotificationItem {
  titulo?: string | null
  descripcion?: string | null
  total?: number | null
  enlace?: string | null
  link?: string | null
  tipo?: string | null
}

export type DashboardNotifications = Record<
  string,
  NotificationItem[] | NotificationItem | null | undefined
>

export interface StudentProgramStat {
  estudiante?: string | null
  programas?: number | null
  cantidad?: number | null
}

export interface MultiplesProgramasStats {
  total?: number | null
  porcentaje?: number | null
  promedioProgramas?: number | null
  maximoProgramas?: number | null
  topEstudiantes?: StudentProgramStat[]
}

export interface EstadisticasGenerales {
  multiplesProgramas?: MultiplesProgramasStats
  resumen?: Record<string, number>
  totales?: Record<string, number>
  [key: string]: unknown
}

export interface AdministracionDashboardResponse {
  matriculas?: MetricChange
  alumnosNuevos?: MetricChange
  proximosInicios?: DashboardProximosInicios
  graduaciones?: DashboardGraduaciones
  evolucionMatricula?: EvolutionPoint[]
  distribucionProgramas?: ProgramDistribution[]
  notificaciones?: DashboardNotifications
  estadisticas?: EstadisticasGenerales
}

export const fetchAdministracionDashboard = async (): Promise<AdministracionDashboardResponse> => {
  const response = await api.get("/administracion/dashboard")
  const data = response.data?.data ?? response.data
  return data as AdministracionDashboardResponse
}

export const exportAdministracionDashboard = async (formato: 'xlsx' | 'csv' | 'json' = 'xlsx'): Promise<void> => {
  try {
    // Usar axios directamente con el backend, similar a exportFinancialReport
    const response = await api.get('/administracion/dashboard/exportar', {
      params: { formato },
      responseType: 'blob', // Importante: especificar que esperamos un blob
    })

    const normalizeHeader = (value: unknown): string | undefined => {
      if (typeof value === 'string') return value
      if (Array.isArray(value)) return value.find((item): item is string => typeof item === 'string')
      return undefined
    }

    const contentType =
      normalizeHeader(response.headers?.['content-type']) ||
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    // Crear blob del response
    const blob = new Blob([response.data], { 
      type: contentType
    })

    // Verificar que el blob tiene contenido
    if (blob.size === 0) {
      throw new Error('El archivo exportado está vacío')
    }

    // Crear URL del blob
    const url = window.URL.createObjectURL(blob)

    // Obtener nombre del archivo desde headers o usar default
    const contentDisposition = normalizeHeader(response.headers?.['content-disposition'])
    let filename = `dashboard_administrativo_${new Date().toISOString().split('T')[0]}.${formato}`

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '')
      }
    }

    // Crear enlace de descarga y hacer click
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Limpiar URL del objeto
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting dashboard:', error)
    throw error
  }
}
