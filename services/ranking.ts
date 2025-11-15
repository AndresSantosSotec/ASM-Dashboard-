import api from './api'

// Types for ranking students and course performance
export interface RankingStudent {
  id: string
  name: string
  email: string
  carnet: string
  program: string
  semester: number
  gpa: number
  credits: number
  totalCredits: number
  coursesCompleted: number
  totalCourses: number
  ranking: number
  previousRanking: number | null
  badges: string[]
  lastAccess: string | null
  cohorte: string | null
  modalidad: string | null
  estado: string
}

export interface CoursePerformance {
  id: string | number
  name: string
  code: string
  period: string
  students: number
  averageGrade?: number | null
  passingRate?: number | null
  topStudent?: {
    id?: string
    name?: string
    grade?: number | null
  }
}

export interface RankingParams {
  page?: number
  perPage?: number
  search?: string
  program?: string
  semester?: number
  sortBy?: string
  categoria?: string | number
  curso?: string | number
}

export interface PaginationInfo {
  current_page: number
  per_page: number
  total: number
  total_pages: number
  from: number
  to: number
  has_more: boolean
}

export interface RankingResponse {
  data: RankingStudent[]
  pagination?: PaginationInfo
  total?: number
}

/**
 * 🥇 Obtener ranking de estudiantes (Moodle + CRM)
 * Endpoint: GET /api/academico/ranking/students
 */
export const fetchRankingStudents = async (
  params: RankingParams = {},
): Promise<RankingResponse> => {
  const res = await api.get('/academico/ranking/students', { params })

  if (!res.data.success) {
    throw new Error(res.data.message || 'Error al obtener ranking')
  }

  const data = res.data.data || []
  const pagination = res.data.pagination
  const total = res.data.total || pagination?.total || data.length

  return { 
    data: data as RankingStudent[], 
    pagination: pagination as PaginationInfo | undefined,
    total: total as number 
  }
}

/**
 * 📊 Obtener estadísticas de cursos
 * Endpoint: GET /api/academico/ranking/courses
 */
export const fetchRankingCourses = async (params: RankingParams = {}) => {
  const res = await api.get('/academico/ranking/courses', { params })

  if (!res.data.success) {
    throw new Error(res.data.message || 'Error al obtener cursos')
  }

  const data = res.data.data || []
  const total = res.data.total || data.length

  return { 
    data: data as CoursePerformance[], 
    total: total as number 
  }
}

/**
 * 📘 Obtener ranking de un curso específico
 * Endpoint: GET /api/academico/ranking/curso/{id}
 */
export const fetchRankingByCourse = async (courseId: string | number, params: RankingParams = {}) => {
  const res = await api.get(`/academico/ranking/curso/${courseId}`, { params })

  if (!res.data.success) {
    throw new Error(res.data.message || 'Error al obtener ranking del curso')
  }

  const data = res.data.data || []
  return { 
    data: data as RankingStudent[], 
    total: data.length,
    courseId: res.data.course_id
  }
}

/**
 * 🏫 Obtener ranking por categoría Moodle
 * Endpoint: GET /api/academico/ranking/categoria/{id}
 */
export const fetchRankingByCategory = async (categoryId: string | number, params: RankingParams = {}) => {
  const res = await api.get(`/academico/ranking/categoria/${categoryId}`, { params })

  if (!res.data.success) {
    throw new Error(res.data.message || 'Error al obtener ranking de categoría')
  }

  const data = res.data.data || []
  return { 
    data: data as RankingStudent[], 
    total: data.length,
    categoryId: res.data.category_id
  }
}

/**
 * 🎓 Obtener ranking por programa interno (CRM)
 * Endpoint: GET /api/academico/ranking/programa/{id}
 */
export const fetchRankingByProgram = async (programId: string | number, params: RankingParams = {}) => {
  const res = await api.get(`/academico/ranking/programa/${programId}`, { params })

  if (!res.data.success) {
    throw new Error(res.data.message || 'Error al obtener ranking del programa')
  }

  const data = res.data.data || []
  return { 
    data: data as RankingStudent[], 
    total: data.length,
    programId: res.data.program_id
  }
}

/**
 * 📄 Descargar reporte de ranking
 * Endpoint: GET /api/academico/ranking/report
 */
export const downloadRankingReport = async (params: RankingParams = {}) => {
  const res = await api.get('/academico/ranking/report', { 
    params, 
    responseType: 'blob' 
  })
  
  return res.data as Blob
}

