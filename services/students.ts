import api from './api'

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

export const fetchEnrolledStudents = async (): Promise<Student[]> => {
  const res = await api.get('/prospectos/status/Inscrito', { params: { per_page: 9999 } })
  const data = Array.isArray(res.data.data) ? res.data.data : res.data
  return data
    .map((p: any) => {
      const prog = Array.isArray(p.programas) && p.programas.length > 0 ? p.programas[0] : null
      if (!prog) return null
      return {
        id: String(p.id),
        name: p.nombre_completo ?? '',
        carnet: String(p.id),
        programId: prog.id,
        program: prog.nombre_del_programa,
        specialty: prog.abreviatura ?? '',
        assignedCourses: Array.isArray(p.courses) ? p.courses.map((c: any) => String(c.id)) : [],
        completedCourses: [],
      }
    })
    .filter(Boolean)
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
