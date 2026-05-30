import api from './api'

export type TareaContableEstado = 'pending' | 'in_progress' | 'action_required' | 'done'
export type TareaContablePrioridad = 'critical' | 'high' | 'medium' | 'low'
export type TareaContableCategoria = 'invoice' | 'payment_distribution' | 'reminder'

export interface TareaContable {
  id: number
  creado_por: number
  asignado_a?: number | null
  titulo: string
  descripcion?: string | null
  fecha: string
  hora_inicio?: string | null
  hora_fin?: string | null
  estado: TareaContableEstado
  prioridad: TareaContablePrioridad
  categoria: TareaContableCategoria
  responsable?: string | null
  monto?: number | string | null
  completada: boolean
  created_at?: string
  updated_at?: string
}

export interface TareaContablePayload {
  titulo: string
  descripcion?: string
  fecha: string
  hora_inicio?: string
  hora_fin?: string
  estado?: TareaContableEstado
  prioridad?: TareaContablePrioridad
  categoria?: TareaContableCategoria
  responsable?: string
  monto?: number | null
  asignado_a?: number | null
}

export const fetchTareasContables = async (): Promise<TareaContable[]> => {
  const res = await api.get('/tareas-contables')
  const data = Array.isArray(res.data) ? res.data : res.data?.data
  return (data ?? []) as TareaContable[]
}

export const createTareaContable = async (payload: TareaContablePayload) => {
  const res = await api.post('/tareas-contables', payload)
  return res.data?.data as TareaContable
}

export const updateTareaContable = async (id: number, payload: Partial<TareaContablePayload> & { completada?: boolean }) => {
  const res = await api.put(`/tareas-contables/${id}`, payload)
  return res.data?.data as TareaContable
}

export const deleteTareaContable = async (id: number) => {
  const res = await api.delete(`/tareas-contables/${id}`)
  return res.data
}
