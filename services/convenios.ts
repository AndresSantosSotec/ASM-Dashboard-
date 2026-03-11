import { api } from './api'
import type { Convenio, PrecioConvenioPrograma, Programa } from '@/types/convenios'

// ── Convenios ───────────────────────────────────────────
export async function fetchConvenios(params?: { activo?: boolean; buscar?: string }) {
  const res = await api.get('/convenios', { params })
  return res.data.convenios as Convenio[]
}

export async function fetchConvenio(id: number) {
  const res = await api.get(`/convenios/${id}`)
  return {
    convenio: res.data.convenio as Convenio,
    programas_disponibles: res.data.programas_disponibles as Programa[],
  }
}

export async function crearConvenio(data: {
  nombre: string
  descripcion?: string
  activo?: boolean
  precios?: { programa_id: number; inscripcion: string; cuota_mensual: string; meses: number }[]
}) {
  const res = await api.post('/convenios', data)
  return res.data.convenio as Convenio
}

export async function actualizarConvenio(id: number, data: { nombre: string; descripcion?: string; activo?: boolean }) {
  const res = await api.put(`/convenios/${id}`, data)
  return res.data.convenio as Convenio
}

export async function toggleActivoConvenio(id: number) {
  const res = await api.patch(`/convenios/${id}/toggle-activo`)
  return res.data as { success: boolean; activo: boolean; mensaje: string }
}

export async function eliminarConvenio(id: number) {
  const res = await api.delete(`/convenios/${id}`)
  return res.data as { success: boolean; mensaje: string }
}

// ── Precios por programa ────────────────────────────────
export async function agregarPrecio(convenioId: number, data: {
  programa_id: number
  inscripcion: string
  cuota_mensual: string
  meses: number
}) {
  const res = await api.post(`/convenios/${convenioId}/precios`, data)
  return res.data.precio as PrecioConvenioPrograma
}

export async function actualizarPrecio(convenioId: number, programaId: number, data: {
  inscripcion: string
  cuota_mensual: string
  meses: number
}) {
  const res = await api.put(`/convenios/${convenioId}/precios/${programaId}`, data)
  return res.data.precio as PrecioConvenioPrograma
}

export async function eliminarPrecio(convenioId: number, programaId: number) {
  await api.delete(`/convenios/${convenioId}/precios/${programaId}`)
}

export async function fetchProgramasDisponibles(convenioId: number) {
  const res = await api.get(`/programas/disponibles/${convenioId}`)
  return res.data.programas as Programa[]
}
