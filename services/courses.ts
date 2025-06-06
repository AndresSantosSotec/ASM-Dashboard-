import api from './api'

export interface CourseInput {
  name: string
  code: string
  area: 'common' | 'specialty'
  credits: number
  startDate: string
  endDate: string
  schedule: string
  duration: string
  facilitatorId?: number | null
}

export interface Course extends CourseInput {
  id: number
  status: 'draft' | 'approved' | 'synced'
  facilitator?: { id: number; name: string } | null
}

export const fetchCourses = async () => {
  const res = await api.get<Course[]>('/courses')
  return res.data
}

export const createCourse = async (data: CourseInput) => {
  const res = await api.post<Course>('/courses', data)
  return res.data
}

export const updateCourse = async (id: number, data: Partial<CourseInput> & { status?: Course['status'] }) => {
  const res = await api.put<Course>(`/courses/${id}`, data)
  return res.data
}

export const deleteCourse = async (id: number) => {
  await api.delete(`/courses/${id}`)
}

export const approveCourse = async (id: number) => {
  const res = await api.post<Course>(`/courses/${id}/approve`)
  return res.data
}

export const syncCourseToMoodle = async (id: number) => {
  const res = await api.post<Course>(`/courses/${id}/sync-moodle`)
  return res.data
}

export const assignFacilitator = async (id: number, facilitatorId: number | null) => {
  const res = await api.post<Course>(`/courses/${id}/assign-facilitator`, { facilitatorId })
  return res.data
}

export const fetchFacilitators = async () => {
  const res = await api.get('/users/role/2')
  return res.data
}

