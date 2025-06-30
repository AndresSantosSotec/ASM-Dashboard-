import api from './api'
import type { Program } from './programs'

export interface Student {
  id: string
  name: string
  carnet: string
  programId: number
  program: string
  specialty: string
  assignedCourses: string[]
  completedCourses: string[]
}

export const fetchStudentProgram = async (
  studentId: string,
): Promise<Program | null> => {
  const res = await api.get('/estudiante-programa', {
    params: { prospecto_id: studentId },
  })
  const data = Array.isArray(res.data) ? res.data : res.data.data
  return data && data.length > 0 ? data[0] : null
}

export const fetchEnrolledStudents = async (): Promise<Student[]> => {
  const res = await api.get('/prospectos/status/Inscrito', {
    params: { per_page: 9999 },
  })
  const data = Array.isArray(res.data.data) ? res.data.data : res.data
  const students = await Promise.all(
    data.map(async (p: any) => {
      let prog =
        Array.isArray(p.programas) && p.programas.length > 0 ? p.programas[0] : null
      if (!prog) {
        try {
          prog = await fetchStudentProgram(String(p.id))
        } catch (err) {
          console.error(err)
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
        completedCourses: [],
      }
    }),
  )
  return students
}

export const assignCourses = async (studentIds: string[], courseIds: string[]) => {
  await api.post('/courses/assign', {
    prospecto_ids: studentIds.map(Number),
    course_ids: courseIds.map(Number),
  })
}

export const unassignCourses = async (studentIds: string[], courseIds: string[]) => {
  await api.post('/courses/unassign', {
    prospecto_ids: studentIds.map(Number),
    course_ids: courseIds.map(Number),
  })
}
