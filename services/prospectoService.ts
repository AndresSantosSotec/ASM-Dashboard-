import api from './api'
import type { ProspectoConProgramas, Prospecto } from '@/types/prospecto'

/** Lista todos los prospectos (sin programas) */
export async function fetchProspectos(): Promise<Prospecto[]> {
  const res = await api.get('/prospectos')
  const data = Array.isArray(res.data) ? res.data : res.data.data
  return data as Prospecto[]
}

/** Trae un prospecto junto con sus programas (programas.programa) */
export async function fetchProspectoWithPrograms(
  id: number
): Promise<ProspectoConProgramas> {
  const res = await api.get<{ data: ProspectoConProgramas }>(`/prospectos/${id}`)
  return res.data.data
}
