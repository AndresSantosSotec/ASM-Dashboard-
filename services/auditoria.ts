import api from './api'

// ===============================
// TIPOS
// ===============================

export interface LogAuditoria {
  id: number
  usuario: string
  email: string
  accion: string
  modulo: string
  detalles: string
  fecha: string
  hora: string
  nivel: 'info' | 'warning' | 'error'
  ip: string
  tipo_log: 'activity' | 'email' | 'collection'
  tiempo_relativo: string
}

export interface EstadisticasAuditoria {
  total: number
  activity: number
  email: number
  collection: number
  hoy: number
}

export interface FiltrosAuditoria {
  search?: string
  tipo?: 'todos' | 'activity' | 'email' | 'collection'
  nivel?: 'todos' | 'info' | 'warning' | 'error'
  fecha_inicio?: string
  fecha_fin?: string
  page?: number
  per_page?: number
}

export interface RespuestaAuditoria {
  logs: LogAuditoria[]
  estadisticas: EstadisticasAuditoria
  pagination: {
    current_page: number
    per_page: number
    total: number
    total_pages: number
    from: number
    to: number
    has_more: boolean
  }
}

// ===============================
// SERVICIOS API
// ===============================

/**
 * Obtener logs de auditoría con filtros
 */
export async function obtenerLogs(filtros?: FiltrosAuditoria): Promise<RespuestaAuditoria> {
  const response = await api.get('/seguridad/auditoria', {
    params: filtros
  })
  
  if (!response.data.success) {
    throw new Error(response.data.message || 'Error al obtener logs')
  }
  
  return response.data.data
}
