import api from './api'

export interface PasswordRecoveryResponse {
  success: boolean
  message: string
  errors?: {
    email?: string[]
  }
}

/**
 * Solicita la recuperación de contraseña para un usuario
 * @param email - Email del usuario registrado
 * @returns Promise con la respuesta del servidor
 */
export const recoverPassword = async (email: string): Promise<PasswordRecoveryResponse> => {
  try {
    const response = await api.post<PasswordRecoveryResponse>('/password/recover', {
      email: email.trim().toLowerCase(),
    })

    return response.data
  } catch (error: any) {
    // Si hay errores de validación (422)
    if (error.response?.status === 422) {
      return {
        success: false,
        message: error.response.data.message || 'El correo electrónico proporcionado no es válido.',
        errors: error.response.data.errors,
      }
    }

    // Error del servidor (500) o error de red
    return {
      success: false,
      message: error.response?.data?.message || 'Ocurrió un error al procesar la solicitud. Por favor, inténtalo de nuevo.',
    }
  }
}
