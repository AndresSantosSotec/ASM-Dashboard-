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

export interface MoodleStudentByCourse {
  user_id: number
  carnet: string
  nombre_completo: string
  email: string
  plan_duracion: string
  ultimo_curso_similar: string
  fecha_ultimo_curso: string
}

export interface MoodleStudentsByCourseResponse {
  filtro_activo: boolean
  dia_detectado: string | null
  total_estudiantes: number
  data: MoodleStudentByCourse[]
}

export const fetchApprovedMoodleCourses = async (carnet: string): Promise<MoodleQueryCourse[]> => {
  const res = await api.get(`/moodle/consultas/aprobados/${carnet}`)
  const data = Array.isArray(res.data.data) ? res.data.data : res.data
  return data as MoodleQueryCourse[]
}

export const fetchStudentsByCourseDay = async (
  courseName: string,
  programId?: number,
  sinFiltro: boolean = false
): Promise<MoodleStudentsByCourseResponse> => {
  const res = await api.post('/moodle/consultas/estudiantes-por-dia', {
    course_name: courseName,
    program_id: programId,
    sin_filtro: sinFiltro
  })
  return res.data as MoodleStudentsByCourseResponse
}

export interface InternalStudentEquivalent {
  id: number
  carnet: string
  nombre_completo: string
  correo: string
  telefono: string
  dia_estudio: string | null
  created_at: string | null
  programas: Array<{
    id: number
    nombre: string
  }>
  programa_principal: {
    id: number
    nombre: string
  } | null
  estado: string
}

export interface InternalStudentsResponse {
  total_buscados: number
  total_encontrados: number
  estudiantes: InternalStudentEquivalent[]
  carnets_no_encontrados: string[]
}

export const fetchInternalStudentEquivalents = async (
  carnets: string[]
): Promise<InternalStudentsResponse> => {
  const res = await api.post('/moodle/consultas/equivalentes-internos', {
    carnets
  })
  return res.data as InternalStudentsResponse
}

export default fetchApprovedMoodleCourses
