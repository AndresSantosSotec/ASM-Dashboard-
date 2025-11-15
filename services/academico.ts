import api from './api'

// ===============================
// TIPOS
// ===============================

export interface Curso {
  course_id: number
  curso: string
  codigo_curso?: string
  fecha_inicio?: string
  fecha_fin?: string
  fecha_matricula?: string
  estado: 'En curso' | 'Finalizado'
}

export interface Calificacion {
  course_id: number
  curso: string
  calificacion: number | null
  nota_aprobacion: number
  estado: 'Sin calificar' | 'Aprobado' | 'Reprobado'
}

export interface ResumenCalificaciones {
  promedio_general: number
  cursos_aprobados: number
  cursos_reprobados: number
  cursos_sin_calificar: number
}

export interface EventoCalendario {
  event_id: number
  titulo: string
  descripcion?: string
  fecha: string
  hora: string
  duracion_minutos?: number
  tipo: string
  curso?: string
}

// ===============================
// SERVICIOS API OPTIMIZADOS
// ===============================

/**
 * 🚀 OPTIMIZADO: Obtener cursos del estudiante
 * 
 * Usa endpoint ligero sin JOINs pesados
 * Formato de fechas en backend (más rápido)
 */
export async function getMisCursos(): Promise<Curso[]> {
  const response = await api.get('/estudiante/academico/mis-cursos')
  
  if (!response.data.success) {
    throw new Error(response.data.message || 'Error al obtener cursos')
  }
  
  return response.data.data.cursos || []
}

/**
 * 🚀 OPTIMIZADO: Obtener calificaciones del estudiante
 * 
 * Endpoint separado para evitar JOIN con cursos
 * Incluye resumen de estadísticas calculadas
 */
export async function getMisCalificaciones(): Promise<{
  resumen: ResumenCalificaciones
  calificaciones: Calificacion[]
}> {
  const response = await api.get('/estudiante/academico/mis-calificaciones')
  
  if (!response.data.success) {
    throw new Error(response.data.message || 'Error al obtener calificaciones')
  }
  
  return response.data.data
}

/**
 * 🚀 OPTIMIZADO: Obtener eventos del calendario
 * 
 * Endpoint ligero con filtros opcionales
 */
export async function getMisEventos(filtros?: {
  fecha_inicio?: string
  fecha_fin?: string
}): Promise<EventoCalendario[]> {
  const response = await api.get('/estudiante/academico/mis-eventos', {
    params: filtros
  })
  
  if (!response.data.success) {
    throw new Error(response.data.message || 'Error al obtener eventos')
  }
  
  return response.data.data.eventos || []
}

/**
 * 🚀 CARGA PARALELA: Obtener todos los datos académicos en una sola llamada
 * 
 * Usa Promise.all() para cargar cursos, calificaciones y eventos simultáneamente
 * Más rápido que cargarlos secuencialmente
 */
export async function cargarDatosAcademicosParalelo(filtrosEventos?: {
  fecha_inicio?: string
  fecha_fin?: string
}) {
  try {
    const [cursos, calificacionesData, eventos] = await Promise.all([
      getMisCursos(),
      getMisCalificaciones(),
      getMisEventos(filtrosEventos)
    ])

    return {
      cursos,
      calificaciones: calificacionesData.calificaciones,
      resumen: calificacionesData.resumen,
      eventos,
      success: true
    }
  } catch (error: any) {
    console.error('[CARGA PARALELA] Error:', error)
    throw error
  }
}

/**
 * Objeto con todos los servicios académicos
 */
const academicoService = {
  getMisCursos,
  getMisCalificaciones,
  getMisEventos,
  cargarDatosAcademicosParalelo,
}

export default academicoService
