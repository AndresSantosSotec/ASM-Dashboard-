import api from './api'
import type {
  ProspectoConProgramas,
  Prospecto,
  ProspectoDetalle,
} from '@/types/prospecto'

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

/** Obtiene prospectos con toda su información relacionada */
export async function getProspectos(
  status?: string
): Promise<ProspectoDetalle[]> {
  const res = await api.get('/prospectos', {
    params: status ? { status } : undefined,
  })
  const data = Array.isArray(res.data) ? res.data : res.data.data
  return data as ProspectoDetalle[]
}
