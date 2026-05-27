import api from './api'

export interface Tarea {
  id: number
  titulo: string
  fecha: string
  horaInicio?: string
  horaFin?: string
  created_by?: number
  user_id?: number
  tipo?: string
  descripcion?: string
  completada?: boolean
}

export interface NotaPagoResumen {
  carnet: string
  id: number | null
  nombre_completo: string
  correo_electronico: string | null
  telefono: string | null
  total_notas: number
  ultima_fecha_pago: string | null
  ultimo_monto_pago: number | null
  factura_emitida: boolean
  fecha_factura_emitida: string | null
}

export const fetchTareas = async (): Promise<Tarea[]> => {
  const res = await api.get('/tareas', { params: { per_page: 9999 } })
  const data = Array.isArray(res.data) ? res.data : res.data.data
  return data as Tarea[]
}

export const updateTarea = async (id: number, payload: Partial<Tarea>) => {
  const res = await api.put(`/tareas/${id}`, payload)
  return res.data
}

export const getNotasPagoResumen = async (params?: { page?: number; per_page?: number }) => {
  const res = await api.get('/notas-pago', {
    params: {
      page: params?.page ?? 1,
      per_page: params?.per_page ?? 200,
    },
  })

  return {
    data: (res.data?.data ?? []) as NotaPagoResumen[],
    pagination: res.data?.pagination,
  }
}

export const marcarFacturaEmitida = async (carnet: string, facturaEmitida: boolean) => {
  const res = await api.post(`/notas-pago/${encodeURIComponent(carnet)}/factura-emitida`, {
    factura_emitida: facturaEmitida,
  })
  return res.data
}
