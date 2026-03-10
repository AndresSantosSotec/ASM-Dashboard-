import api from './api'

export interface UserDashboardData {
  user: {
    id: number
    name: string
    email: string
    rol?: string
    carnet?: string
  }
  stats: {
    // Estadísticas de estudiante (Rol 3)
    cursos_activos?: number
    tareas_pendientes?: number
    promedio_general?: number
    cursos_completados?: number
    total_cursos?: number
    
    // Estadísticas de admin (Rol 1) y asesor (Rol 7)
    prospectos_asignados?: number
    estudiantes_total?: number
    prospectos_nuevos?: number
    total_prospectos?: number
    tareas_atrasadas?: number
    alertas_alumno_nuevo?: number
    alertas_urgentes?: number
    alertas_expiradas?: number
    
    // Estadísticas de finanzas (Rol 5)
    pagos_procesados_mes?: number
    monto_total_mes?: number
    pagos_pendientes?: number
    monto_pendiente?: number
    pagos_vencidos?: number
    
    // Estadísticas de seguridad (Rol 6)
    sesiones_activas?: number
    sesiones_hoy?: number
    usuarios_unicos_hoy?: number
    tiempo_promedio_sesion?: number
    dispositivo_mas_usado?: string
    
    // Estadísticas de administrativo (Rol 4)
    estudiantes_activos?: number
    estudiantes_nuevos_mes?: number
    programas_activos?: number
    cursos_programados?: number
    
    // Estadísticas de docente (Rol 2)
    cursos_asignados?: number
    total_estudiantes?: number
    promedio_asistencia?: number
  }
  recentActivity?: {
    type: string
    title: string
    description: string
    timestamp: string
  }[]
  quickAccess?: {
    id: number
    title: string
    description: string
    path: string
    icon: string
  }[]
  alertas_detalle?: Array<{
    id: number
    prospecto_id: number
    prospecto_nombre: string
    prospecto_correo: string
    prospecto_telefono: string
    prospecto_carnet: string | null
    asesor_id: number
    asesor_nombre: string
    estado: string
    dias_restantes: number
    dias_atraso: number
    fecha_limite: string
    fecha_creacion: string
  }>
}

export const fetchDashboardData = async (): Promise<UserDashboardData> => {
  try {
    const response = await api.get('/dashboard/welcome')
    return response.data
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    throw error
  }
}

export const fetchProspectosAprobacion = async (): Promise<{
  puede_ver_seccion_aprobacion?: boolean
  prospectos_aprobacion: Array<{
    id: number
    prospecto_id: number
    prospecto_nombre: string
    prospecto_correo: string
    prospecto_telefono: string
    prospecto_carnet: string | null
    asesor_id: number
    asesor_nombre: string
    fase_aprobacion: string
    estado_fase: string
    porcentaje_avance: number
    fecha_ingreso: string
    fecha_limite_fase: string | null
    observaciones: string | null
    dias_en_fase: number
    prioridad: string
  }>
  stats: {
    total: number
    urgentes: number
    por_fase: Record<string, number>
    proximos?: { hacia_academica?: number; hacia_financiera?: number; hacia_credenciales?: number }
  }
}> => {
  try {
    const response = await api.get('/dashboard/prospectos-aprobacion')
    return response.data
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return {
        puede_ver_seccion_aprobacion: false,
        prospectos_aprobacion: [],
        stats: {
          total: 0,
          urgentes: 0,
          por_fase: {},
          proximos: { hacia_academica: 0, hacia_financiera: 0, hacia_credenciales: 0 }
        }
      }
    }
    console.error('Error fetching prospectos aprobación:', error)
    throw error
  }
}

export const fetchCurrentUserInfo = async (): Promise<any> => {
  try {
    const response = await api.get('/user')
    return response.data
  } catch (error) {
    console.error('Error fetching current user:', error)
    throw error
  }
}

export interface InscritoMes {
  ep_id: number
  prospecto_id: number
  nombre_completo: string
  correo_electronico: string
  telefono: string
  carnet: string | null
  programa_nombre: string
  programa_abreviatura: string
  duracion_meses: string
  monto_inscripcion: number | null
  fecha_inscripcion: string
  asesor_nombre: string
  asesor_id: number
}

export interface InscritosMesResponse {
  success: boolean
  data: InscritoMes[]
  total: number
  mes: number
  ano: number
  mes_nombre: string
  es_admin: boolean
}

export const fetchInscritosPorMes = async (mes: number, ano: number): Promise<InscritosMesResponse> => {
  const response = await api.get('/dashboard/inscritos-por-mes', { params: { mes, ano } })
  return response.data
}

export const downloadInscritosPorMes = async (mes: number, ano: number, mesNombre: string, format: 'csv' | 'excel' = 'excel'): Promise<void> => {
  const ext = format === 'excel' ? 'xlsx' : 'csv'
  const mime = format === 'excel'
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'text/csv;charset=utf-8;'
  const response = await api.get('/dashboard/inscritos-por-mes/export', {
    params: { mes, ano, format },
    responseType: 'blob',
  })
  const url = URL.createObjectURL(new Blob([response.data], { type: mime }))
  const link = document.createElement('a')
  link.href = url
  link.download = `Inscritos_${mesNombre}_${ano}.${ext}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default {
  fetchDashboardData,
  fetchProspectosAprobacion,
  fetchCurrentUserInfo,
  fetchInscritosPorMes,
  downloadInscritosPorMes,
}
