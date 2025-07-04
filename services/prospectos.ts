import api from './api'

export interface Prospecto {
  id: number
  status: string
  created_by?: number
}

export const fetchProspectos = async (): Promise<Prospecto[]> => {
  const res = await api.get('/prospectos')
  const data = Array.isArray(res.data) ? res.data : res.data.data
  return data as Prospecto[]
}

export const fetchProspectCountByStatus = async (
  status: string,
): Promise<number> => {
  const res = await api.get(`/prospectos/status/${encodeURIComponent(status)}`, {
    params: { per_page: 9999 },
  })
  const data = Array.isArray(res.data) ? res.data : res.data.data
  return Array.isArray(data) ? data.length : 0
}
