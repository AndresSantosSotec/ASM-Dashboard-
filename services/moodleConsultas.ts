import api from './api'

export interface MoodleConsultaCourse {
  courseid: number
  coursename: string
  estado_curso: string
  [key: string]: any
}

export const fetchCursos = async (carnet: string): Promise<MoodleConsultaCourse[]> => {
  const res = await api.get(`/moodle/consultas/${encodeURIComponent(carnet)}`)
  return Array.isArray(res.data?.data) ? res.data.data : []
}

export const fetchAprobados = async (carnet: string): Promise<MoodleConsultaCourse[]> => {
  const res = await api.get(`/moodle/consultas/aprobados/${encodeURIComponent(carnet)}`)
  return Array.isArray(res.data?.data) ? res.data.data : []
}

export const fetchReprobados = async (carnet: string): Promise<MoodleConsultaCourse[]> => {
  const res = await api.get(`/moodle/consultas/reprobados/${encodeURIComponent(carnet)}`)
  return Array.isArray(res.data?.data) ? res.data.data : []
}
