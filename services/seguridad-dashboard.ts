import api from './api'

export interface EstadisticasDashboard {
  usuarios_activos: number
  usuarios_activos_cambio: number
  roles_configurados: number
  roles_configurados_cambio: number
  permisos_totales: number
  permisos_totales_cambio: number
  eventos_auditoria: number
  eventos_auditoria_cambio: number
}

export interface ActividadSeguridad {
  inicios_sesion: number
  cambios_permisos: number
  cambios_configuracion: number
  intentos_fallidos: number
}

export interface ActividadReciente {
  id: number
  tipo: 'usuario_creado' | 'rol_modificado' | 'usuario_desactivado' | 'politica_actualizada' | 'permiso_modificado' | 'login_fallido'
  titulo: string
  descripcion: string
  tiempo_relativo: string
  created_at: string
}

export interface AlertaSeguridad {
  id: number
  nivel: 'critico' | 'alto' | 'medio' | 'bajo'
  tipo: string
  titulo: string
  descripcion: string
  detalles: string
  tiempo_relativo: string
  requiere_accion: boolean
  acciones_disponibles: string[]
}

export interface SesionActiva {
  id: string
  usuario: string
  email: string
  rol: string
  iniciales: string
  ip_address: string
  tiempo_conectado: string
  last_activity: string
}

export interface RespuestaDashboard {
  estadisticas: EstadisticasDashboard
  actividad: ActividadSeguridad
  actividad_reciente: ActividadReciente[]
  alertas: AlertaSeguridad[]
  sesiones_activas: SesionActiva[]
}

export const seguridadDashboardService = {
  async obtenerDashboard(): Promise<RespuestaDashboard> {
    const response = await api.get('/seguridad/dashboard')
    return response.data
  },

  async cerrarSesion(sessionId: string): Promise<{ message: string }> {
    const response = await api.post(`/seguridad/accesos/${sessionId}/cerrar`)
    return response.data
  },

  async cerrarTodasLasSesiones(): Promise<{ message: string }> {
    const response = await api.post('/seguridad/accesos/cerrar-todas')
    return response.data
  }
}
