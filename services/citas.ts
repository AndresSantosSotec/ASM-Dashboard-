import api from './api'

export interface Cita {
  id: number
  datecita: string
  descricita: string
  created_by?: number
  user_id?: number
}

export const fetchCitas = async (): Promise<Cita[]> => {
  const res = await api.get('/citas', { params: { per_page: 9999 } })
  const data = Array.isArray(res.data) ? res.data : res.data.data
  return data as Cita[]
}
