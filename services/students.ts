import api from './api'
import type { Program } from './programs'
import type { Course } from './courses'

export interface Student {
  id: string;
  name: string;
  carnet: string;
  programId: number;
  program: string;
  specialty: string;
  startDate: string | null; // Fecha de inscripción (fecha_inicio_especifica)
  programs: Program[];
  assignedCourses: string[];
  assignedCourseNames: string[];
  completedCourses: string[];
}

/**
 * Obtiene todos los programas académicos para un estudiante
 */
export const fetchStudentPrograms = async (
  studentId: string,
): Promise<Program[]> => {
  const res = await api.get('/estudiante-programa', {
    params: { prospecto_id: studentId },
  })
  const data = Array.isArray(res.data) ? res.data : res.data.data
  return Array.isArray(data) ? data : []
}

export const fetchStudentProgram = async (
  studentId: string,
): Promise<Program | null> => {
  try {
    const res = await api.get(`/estudiante-programa/${studentId}`)
    const data = Array.isArray(res.data) ? res.data : res.data.data
    return data.length > 0 ? data[0] : null
  } catch (err: any) {
    if (err.response?.status === 404) {
      return null
    }
    throw err
  }
}

export const fetchEnrolledStudents = async (): Promise<Student[]> => {
  const res = await api.get('/prospectos/status/Inscrito', {
    params: { per_page: 9999 },
  })
  const data = Array.isArray(res.data.data) ? res.data.data : res.data

  const students = await Promise.all(
    data.map(async (p: any) => {
      let progs: Program[] = []
      if (Array.isArray(p.programas) && p.programas.length > 0) {
        progs = p.programas
      } else {
        try {
          progs = await fetchStudentPrograms(String(p.id))
        } catch (err) {
          console.error('Error fetching student programs', err)
        }
      }

      const first = progs[0]

      return {
        id: String(p.id),
        name: p.nombre_completo ?? '',
        carnet: p.carnet ?? String(p.id),
        programId: first?.id ?? 0,
        program: first?.nombre_del_programa ?? '',
        specialty: first?.abreviatura ?? '',
        startDate: p.fecha_inicio_especifica ?? null, // Mapeo agregado aquí
        programs: progs,
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

export const bulkassingCourses = async (
  studentIds: string[],
  courseIds: string[],
) => {
  await api.post('/courses/bulkassign', {
    prospecto_ids: studentIds.map(Number),
    course_ids: courseIds.map(Number),
  })
}
