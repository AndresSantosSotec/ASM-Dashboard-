import api from './api'

// ===============================
// HELPERS
// ===============================

function getHeaderString(value: unknown): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

// ===============================
// TIPOS
// ===============================

export interface AccesoSesion {
  id: number
  usuario: string
  email: string
  rol: string
  ip: string
  dispositivo: string
  fecha: string
  hora: string
  ultima_actividad?: string | null
  estado: 'Activo' | 'Cerrado'
  duracion_minutos?: number | null
}

export interface ResumenAccesos {
  total: number
  activos: number
  cerrados: number
  hoy: number
}

export interface FiltrosAccesos {
  search?: string
  estado?: 'todos' | 'activo' | 'cerrado'
  fecha_inicio?: string
  fecha_fin?: string
  page?: number
  per_page?: number
}

export interface RespuestaAccesos {
  accesos: AccesoSesion[]
  resumen: ResumenAccesos
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
 * Obtener lista de accesos/sesiones con filtros
 */
export async function obtenerAccesos(filtros?: FiltrosAccesos): Promise<RespuestaAccesos> {
  const response = await api.get('/seguridad/accesos', {
    params: filtros
  })
  
  if (!response.data.success) {
    throw new Error(response.data.message || 'Error al obtener accesos')
  }
  
  return response.data.data
}

/**
 * Cerrar sesión por ID
 */
export async function cerrarSesion(sessionId: number): Promise<void> {
  const response = await api.post(`/seguridad/accesos/${sessionId}/cerrar`)
  
  if (!response.data.success) {
    throw new Error(response.data.message || 'Error al cerrar sesión')
  }
}

/**
 * Descargar reporte PDF de accesos
 */
export async function descargarReporteAccesos(filtros?: FiltrosAccesos): Promise<void> {
  const response = await api.get('/seguridad/accesos/reporte', {
    params: filtros,
    responseType: 'blob'
  })
  
  // Crear enlace de descarga
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  
  // Obtener nombre del archivo del header
  const contentDisposition = getHeaderString(response.headers?.['content-disposition'])
  let filename = 'Reporte_Accesos.pdf'
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1]
    }
  }
  
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const seguridadService = {
  obtenerAccesos,
  cerrarSesion,
  descargarReporteAccesos,
}

export default seguridadService
