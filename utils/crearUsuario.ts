import Swal from "sweetalert2"

import api from "@/services/api"



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
    console.log("[DEBUG] crearUsuarioEnBD → payload:", payload)

    const token = localStorage.getItem("token") || ""
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    const body = await res.json();

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

    const message =
      err.response?.data?.message || err.message || "Ocurrió un error al guardar el usuario."

    await Swal.fire({
      icon: "error",
      title: "Error",
      text: message,
    })

    throw err
  }
}
