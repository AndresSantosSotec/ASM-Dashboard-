import api from './api'

// ===============================
// TIPOS
// ===============================

export interface UserProfile {
  id: number
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string
  is_active: boolean
  email_verified: boolean
  mfa_enabled: boolean
  last_login: string | null
  rol: string
  created_at: string
}

export interface UpdateProfileData {
  first_name?: string
  last_name?: string
}

export interface CambiarContrasenaData {
  contrasena_actual: string
  contrasena_nueva: string
  contrasena_nueva_confirmation: string
}

// ===============================
// SERVICIOS API
// ===============================

/**
 * Obtener información del perfil del usuario autenticado
 */
export async function getMiPerfil(): Promise<UserProfile> {
  const response = await api.get('/mi-perfil')

  if (!response.data.success) {
    throw new Error(response.data.message || 'Error al obtener el perfil')
  }

  return response.data.data
}

/**
 * Actualizar información básica del perfil
 */
export async function actualizarPerfil(data: UpdateProfileData): Promise<UserProfile> {
  const response = await api.put('/mi-perfil/actualizar', data)

  if (!response.data.success) {
    throw new Error(response.data.message || 'Error al actualizar el perfil')
  }

  return response.data.data
}

/**
 * Cambiar contraseña del usuario (Admin/Asesor)
 */
export async function cambiarContrasena(data: CambiarContrasenaData): Promise<void> {
  const response = await api.post('/mi-perfil/cambiar-contrasena', data)

  if (!response.data.success) {
    throw new Error(response.data.message || 'Error al cambiar la contraseña')
  }
}

/**
 * Objeto con todos los servicios de perfil de usuario
 */
const miPerfilService = {
  getMiPerfil,
  actualizarPerfil,
  cambiarContrasena,
}

export default miPerfilService
