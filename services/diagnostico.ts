import api from './api'

export interface DiagnosticoResponse {
  success: boolean
  data?: any[]
  query_time_ms: number
  rows_returned?: number
  connection_status: 'OK' | 'RECOVERED' | 'ERROR' | 'FAILED_RECOVERY'
  message: string
  error?: string
  error_type?: string
  // Mantener compatibilidad con interfaz vieja
  status?: 'OK' | 'RECOVERED' | 'ERROR'
  latency_ms?: number
  db_status?: 'connected' | 'reconnected' | 'disconnected'
}

/**
 * 🧪 Probar conexión ULTRA LIGERA con Moodle
 * Endpoint: GET /api/test/moodle
 * Query: SELECT id, fullname FROM mdl_course LIMIT 5
 */
export const probarConexionMoodle = async (): Promise<DiagnosticoResponse> => {
  const res = await api.get('/test/moodle')
  
  // Normalizar respuesta para compatibilidad
  const data = res.data as DiagnosticoResponse
  
  return {
    ...data,
    // Mapear campos para compatibilidad
    status: data.connection_status === 'OK' ? 'OK' 
          : data.connection_status === 'RECOVERED' ? 'RECOVERED' 
          : 'ERROR',
    latency_ms: data.query_time_ms,
    db_status: data.connection_status === 'OK' ? 'connected'
             : data.connection_status === 'RECOVERED' ? 'reconnected'
             : 'disconnected'
  }
}

/**
 * 📊 Diagnóstico completo con métricas (DESHABILITADO)
 * Usar probarConexionMoodle() en su lugar
 */
export const diagnosticoCompletoMoodle = async (): Promise<DiagnosticoResponse> => {
  // Redirigir a la consulta ligera
  return probarConexionMoodle()
}
