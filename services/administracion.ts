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
  total: number
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

export const exportAdministracionDashboard = async (): Promise<Blob> => {
  const response = await api.get("/administracion/dashboard/exportar", {
    responseType: "blob",
  })
  return response.data as Blob
}
