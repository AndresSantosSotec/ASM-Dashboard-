import api from './api'
import type { Program } from './programs'
import type { Course } from './courses'

export interface Student {
  id: string
  name: string
  carnet: string
  programId: number
  program: string
  specialty: string
  assignedCourses: string[]
  assignedCourseNames: string[]
  completedCourses: string[]
}

export const fetchStudentProgram = async (
  studentId: string,
): Promise<Program | null> => {
  try {
    const res = await api.get(`/estudiante-programa/${studentId}`)
    const data = Array.isArray(res.data)
      ? res.data
      : res.data.data
    return data.length > 0 ? data[0] : null
  } catch (err: any) {
    if (err.response?.status === 404) {
      return null
    }
    throw err
  }
}

export const fetchEnrolledStudents = async (): Promise<Student[]> => {
  const perPage = 200
  let page = 1
  const students: Student[] = []

  while (true) {
    const res = await api.get('/prospectos/status/Inscrito', {
      params: { per_page: perPage, page },
    })
    const data = Array.isArray(res.data.data) ? res.data.data : res.data

    const pageStudents = await Promise.all(
      data.map(async (p: any) => {
        let prog =
          Array.isArray(p.programas) && p.programas.length > 0
            ? p.programas[0]
            : null

        if (!prog) {
          try {
            prog = await fetchStudentProgram(String(p.id))
          } catch (err) {
            console.error('Error fetching student program', err)
          }
        }

        return {
          id: String(p.id),
          name: p.nombre_completo ?? '',
          carnet: String(p.id),
          programId: prog?.id ?? 0,
          program: prog?.nombre_del_programa ?? '',
          specialty: prog?.abreviatura ?? '',
          assignedCourses: Array.isArray(p.courses)
            ? p.courses.map((c: any) => String(c.id))
            : [],
          assignedCourseNames: Array.isArray(p.courses)
            ? p.courses.map((c: any) => c.name)
            : [],
          completedCourses: [],
        }
      }),
    )

    students.push(...pageStudents)

    if (data.length < perPage) break
    page++
  }

  return students
}

export const fetchStudentCourseLists = async (
  studentId: string,
): Promise<{ assigned: Course[]; completed: Course[] }> => {
  let res
  try {
    res = await api.get(`/prospectos/${studentId}`)
  } catch (err: any) {
    if (err.response?.status === 404) {
      return { assigned: [], completed: [] }
    }
    throw err
  }

  const data = Array.isArray(res.data) ? res.data : res.data.data
  const mapCourse = (c: any): Course => ({
    id: c.id,
    name: c.name,
    code: c.code,
    area: c.area,
    credits: c.credits,
    startDate: c.start_date,
    endDate: c.end_date,
    schedule: c.schedule,
    duration: c.duration,
    programIds: Array.isArray(c.programas) ? c.programas.map((p: any) => p.id) : [],
    facilitatorId: c.facilitator_id ?? null,
    status: c.status,
    facilitator: c.facilitator ?? null,
    programas: c.programas ?? [],
  })

  const assigned = Array.isArray(data.courses) ? data.courses.map(mapCourse) : []

  return {
    assigned,
    completed: Array.isArray(data.completed_courses)
      ? data.completed_courses.map(mapCourse)
      : [],
  }
}

export const assignCourses = async (
  studentIds: string[],
  courseIds: string[],
) => {
  await api.post('/courses/assign', {
    prospecto_ids: studentIds.map(Number),
    course_ids: courseIds.map(Number),
  })
}

export const unassignCourses = async (
  studentIds: string[],
  courseIds: string[],
) => {
  await api.post('/courses/unassign', {
    prospecto_ids: studentIds.map(Number),
    course_ids: courseIds.map(Number),
  })
}

export const updateStudentStatus = async (
  studentId: string,
  status: string,
) => {
  await api.put(`/prospectos/${studentId}/status`, { status })
}

export const bulkUpdateStudentStatus = async (
  studentIds: string[],
  status: string,
) => {
  await api.put('/prospectos/bulk-update-status', {
    prospecto_ids: studentIds.map(Number),
    status,
  })
}

export const inactivateStudents = async (studentIds: string[]) => {
  await bulkUpdateStudentStatus(studentIds, 'Inactivo')
}
