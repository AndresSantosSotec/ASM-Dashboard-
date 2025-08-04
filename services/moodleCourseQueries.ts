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

export interface AcademicStatusCourse {
  courseid: number
  coursename: string
  period: string
  state: string
  grade: number | null
}

export interface AcademicStatus {
  userid: number
  carnet: string
  fullname: string
  estado: string
  program: string
  inscription_date: string
  semester: number
  average_grade: number
  approved_courses: number
  failed_courses: number
  in_progress_courses: number
  credits_completed: number
  progress_percentage: number
  courses: AcademicStatusCourse[]
}

export const fetchStudentAcademicStatus = async (
  carnet: string,
): Promise<AcademicStatus> => {
  const res = await api.get(`/moodle/consultas/estatus/${carnet}`)
  const data = Array.isArray(res.data.data) ? res.data.data : res.data
  return data as AcademicStatus
}

export const fetchApprovedMoodleCourses = async (
  carnet: string,
): Promise<MoodleQueryCourse[]> => {
  const res = await api.get(`/moodle/consultas/aprobados/${carnet}`)
  const data = Array.isArray(res.data.data) ? res.data.data : res.data
  return data as MoodleQueryCourse[]
}

export default fetchApprovedMoodleCourses
