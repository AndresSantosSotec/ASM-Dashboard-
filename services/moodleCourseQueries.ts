import api from './api'

export interface MoodleQueryCourse {
  userid: number
  carnet: string
  fullname: string
  courseid: number
  coursename: string
  fecha_inicio_curso: string
  fecha_fin_curso: string
  finalgrade: number | null
  estado_curso: string
}

export const fetchApprovedMoodleCourses = async (carnet: string): Promise<MoodleQueryCourse[]> => {
  const res = await api.get(`/moodle/consultas/aprobados/${carnet}`)
  const data = Array.isArray(res.data.data) ? res.data.data : res.data
  return data as MoodleQueryCourse[]
}

export default fetchApprovedMoodleCourses
