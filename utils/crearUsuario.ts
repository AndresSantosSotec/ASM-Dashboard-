import Swal from "sweetalert2"
import { API_BASE_URL } from "./apiConfig"

const API_URL = `${API_BASE_URL}/`

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

export async function crearUsuarioEnBD(payload: CrearUsuarioPayload): Promise<{ id: number }> {
  try {
    const token = localStorage.getItem("token") || ""
    const res = await fetch(`${API_URL}api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const body = await res.json()
    if (!res.ok) {
      throw new Error(body.message || `HTTP ${res.status}`)
    }

    await Swal.fire({
      icon: "success",
      title: "Usuario creado",
      text: "Las credenciales han sido almacenadas correctamente en la base de datos.",
      confirmButtonText: "Aceptar"
    })
    return body
  } catch (err: any) {
    console.error("❌ Error creando usuario:", err)
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message || "Ocurrió un error al guardar el usuario.",
    })
    throw err
  }
}