import Swal from "sweetalert2"
import { API_BASE_URL } from "./apiConfig"

const API_URL = `${API_BASE_URL}` // Ejemplo: "http://localhost:8000"

export interface CrearUsuarioPayload {
  username: string
  email: string
  password: string
  first_name?: string
  last_name?: string
  is_active: boolean
  email_verified: boolean
  mfa_enabled: boolean
  rol: number
}

export async function crearUsuarioEnBD(
  payload: CrearUsuarioPayload
): Promise<{ id: number }> {
  try {
    // Obtener token (puede venir vacío si no existe en localStorage)
    const token = localStorage.getItem("token") || ""
    console.log("[DEBUG] crearUsuarioEnBD → token:", token)

    // Construir la URL final apuntando a /api/users
    const url = `${API_URL}/api/users`
    console.log("[DEBUG] crearUsuarioEnBD → URL final:", url)

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    // Leer respuesta JSON
    const body = await res.json()

    // Si el status no es OK, arrojar excepción para el catch
    if (!res.ok) {
      throw new Error(body.message || `HTTP ${res.status}`)
    }

    // Mostrar alerta de éxito
    await Swal.fire({
      icon: "success",
      title: "Usuario creado",
      text: "Las credenciales han sido almacenadas correctamente en la base de datos.",
      confirmButtonText: "Aceptar",
    })

    // Devolver el body (se asume que contiene { id: number, ... })
    return body
  } catch (err: any) {
    console.error("❌ Error creando usuario:", err)

    // Mostrar alerta de error con el mensaje
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message || "Ocurrió un error al guardar el usuario.",
    })

    throw err
  }
}
