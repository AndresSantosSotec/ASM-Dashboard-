import api from './api'

// Types for ranking students and course performance
export interface RankingStudent {
  id: string
  name: string
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
}

export interface CoursePerformance {
  id: string
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
}

// Fetch ranking of students from backend
// Requires an endpoint like GET /ranking/students
export const fetchRankingStudents = async (params: RankingParams) => {
  const res = await api.get('/ranking/students', { params })
  const data = Array.isArray(res.data.data) ? res.data : { data: res.data, total: res.data.length }
  return { data: data.data as RankingStudent[], total: data.total as number }
}

// Fetch course performance ranking
// Requires an endpoint like GET /ranking/courses
export const fetchRankingCourses = async (params: RankingParams) => {
  const res = await api.get('/ranking/courses', { params })
  const data = Array.isArray(res.data.data) ? res.data : { data: res.data, total: res.data.length }
  return { data: data.data as CoursePerformance[], total: data.total as number }
}

// Download ranking report as file
// Requires an endpoint like GET /ranking/report that returns a blob
export const downloadRankingReport = async (params: RankingParams) => {
  const res = await api.get('/ranking/report', { params, responseType: 'blob' })
  return res.data as Blob
}
