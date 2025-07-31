import api from './api'

export interface Program {
  id: number
  abreviatura: string
  nombre_del_programa: string
  meses: number
}

export const fetchPrograms = async (): Promise<Program[]> => {
  const res = await api.get('/programas')
  const data = Array.isArray(res.data) ? res.data : res.data.data
  return data as Program[]
}
