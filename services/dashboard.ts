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
    cursos_activos?: number
    tareas_pendientes?: number
    prospectos_asignados?: number
    estudiantes_total?: number
    promedio_general?: number
    cursos_completados?: number
  }
  recentActivity?: {
    type: string
    title: string
    description: string
    timestamp: string
  }[]
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

export const fetchCurrentUserInfo = async (): Promise<any> => {
  try {
    const response = await api.get('/user')
    return response.data
  } catch (error) {
    console.error('Error fetching current user:', error)
    throw error
  }
}

export default {
  fetchDashboardData,
  fetchCurrentUserInfo
}
