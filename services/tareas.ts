import api from './api'

export interface Tarea {
  id: number
  titulo: string
  fecha: string
  horaInicio?: string
  horaFin?: string
  created_by?: number
  user_id?: number
}

export const fetchTareas = async (): Promise<Tarea[]> => {
  const res = await api.get('/tareas', { params: { per_page: 9999 } })
  const data = Array.isArray(res.data) ? res.data : res.data.data
  return data as Tarea[]
}
