import api from './api'

// ===============================
// TIPOS
// ===============================

// Datos del prospecto (SOLO LECTURA)
export interface Prospecto {
  id: number
  nombre_completo: string
  carnet: string
  correo_electronico?: string
  fecha_nacimiento?: string
  genero?: string
}

// Programa académico
export interface ProgramaAcademico {
  id: number
  nombre: string
  codigo?: string
  fecha_inicio?: string
  estado?: string
}

// Perfil editable del estudiante
export interface ProfileStudent {
  id: number
  user_id: number
  telefono?: string
  telefono_emergencia?: string
  nombre_contacto_emergencia?: string
  parentesco_emergencia?: string
  direccion?: string
  ciudad?: string
  biografia?: string
  foto_perfil?: string
  metadata?: any
  created_at?: string
  updated_at?: string
}

export interface AcademicStats {
  promedio_general: number
  cursos_aprobados: number
  cursos_actuales: number
  creditos_aprobados: number
  creditos_totales: number
}

// Respuesta completa del perfil
export interface PerfilData {
  prospecto: Prospecto
  programa: ProgramaAcademico | null
  perfil_editable: ProfileStudent
  estadisticas: AcademicStats
}

export interface CourseHistoryItem {
  curso: string
  codigo_curso?: string
  fecha_inicio?: string
  fecha_fin?: string
  creditos?: number | null
  calificacion?: number | null
  estado: 'En curso' | 'Aprobado' | 'Reprobado'
}

export interface HistorialAcademico {
  resumen: AcademicStats
  cursos: CourseHistoryItem[]
  nombre_completo: string
  username: string
}

export interface UpdateProfileData {
  telefono?: string
  telefono_emergencia?: string
  nombre_contacto_emergencia?: string
  parentesco_emergencia?: string
  direccion?: string
  ciudad?: string
  biografia?: string
  foto_perfil?: string
}

// ===============================
// SERVICIOS API
// ===============================

/**
 * Obtener información completa del perfil del estudiante autenticado
 */
export async function getMiPerfil(): Promise<PerfilData> {
  const response = await api.get('/estudiante/perfil/mi-perfil')
  
  if (!response.data.success) {
    throw new Error(response.data.message || 'Error al obtener el perfil')
  }
  
  return response.data.data
}

/**
 * Obtener historial académico completo del estudiante desde Moodle
 */
export async function getHistorialAcademico(): Promise<HistorialAcademico> {
  const response = await api.get('/estudiante/perfil/historial-academico')
  
  if (!response.data.success) {
    throw new Error(response.data.message || 'Error al obtener el historial académico')
  }
  
  return response.data.data
}

/**
 * Actualizar información personal del perfil
 */
export async function actualizarPerfil(data: UpdateProfileData): Promise<ProfileStudent> {
  const response = await api.put('/estudiante/perfil/actualizar', data)
  
  if (!response.data.success) {
    throw new Error(response.data.message || 'Error al actualizar el perfil')
  }
  
  return response.data.data
}

/**
 * Objeto con todos los servicios de perfil
 */
const profileService = {
  getMiPerfil,
  getHistorialAcademico,
  actualizarPerfil,
}

export default profileService
