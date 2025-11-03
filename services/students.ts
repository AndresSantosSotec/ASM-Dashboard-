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
  // Simple in-memory cache to avoid duplicate network requests when the
  // same student's programs are requested multiple times during a session.
  // This is helpful when users open/close the assignment view repeatedly.
  if (!(globalThis as any).__studentProgramsCache) {
    ;(globalThis as any).__studentProgramsCache = new Map<string, Program[]>()
  }
  const cache: Map<string, Program[]> = (globalThis as any).__studentProgramsCache

  if (cache.has(studentId)) {
    return cache.get(studentId)!
  }

  try {
    const res = await api.get('/estudiante-programa', {
      params: { prospecto_id: studentId },
    })
    const data = Array.isArray(res.data) ? res.data : res.data.data
    const result = Array.isArray(data) ? data : []
    cache.set(studentId, result)
    return result
  } catch (err: any) {
    // Si el backend responde 404 u otro error, devolvemos array vacío
    // para no romper la carga de la UI. El llamador puede manejarlo.
    console.error(`Error fetching student programs for ${studentId}:`, err?.message || err)
    return []
  }
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

// Caché simple para estudiantes
let studentsCache: {
  data: Student[];
  timestamp: number;
} | null = null;

const STUDENTS_CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

export const fetchEnrolledStudents = async (forceRefresh = false): Promise<Student[]> => {
  // Verificar caché
  if (!forceRefresh && studentsCache && (Date.now() - studentsCache.timestamp) < STUDENTS_CACHE_DURATION) {
    console.log('[CACHE] Usando estudiantes en caché');
    return studentsCache.data;
  }

  console.log('[API] Cargando estudiantes desde servidor...');
  const startTime = Date.now();

  const res = await api.get('/prospectos/status/Inscrito', {
    params: { per_page: 9999 },
  })
  const data = Array.isArray(res.data.data) ? res.data.data : res.data

  const students = data.map((p: any) => {
    // Procesamiento síncrono para mejor rendimiento
    const progs: any[] = Array.isArray(p.programas) && p.programas.length > 0 ? p.programas : []
    const first = progs[0]
    const info = first?.programa ?? first

    return {
      id: String(p.id),
      name: p.nombre_completo ?? '',
      carnet: p.carnet ?? String(p.id),
      programId: info?.id ?? 0,
      program: info?.nombre_del_programa ?? '',
      specialty: info?.abreviatura ?? '',
      startDate: p.fecha_inicio_especifica ?? first?.fecha_inicio ?? null,
      programs: progs.map((pr: any) => pr.programa ?? pr),
      assignedCourses: Array.isArray(p.courses)
        ? p.courses.map((c: any) => String(c.id))
        : [],
      assignedCourseNames: Array.isArray(p.courses)
        ? p.courses.map((c: any) => c.name)
        : [],
      completedCourses: [],
    }
  })

  // Guardar en caché
  studentsCache = {
    data: students,
    timestamp: Date.now(),
  };

  const loadTime = Date.now() - startTime;
  console.log(`[PERFORMANCE] Estudiantes cargados en ${loadTime}ms`);

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

export const bulkAssignCourses = async (
  assignments: Array<{ studentId: string; courseIds: string[] }>
) => {
  await api.post('/courses/bulk-assign', {
    assignments: assignments.map(a => ({
      studentId: Number(a.studentId),
      courseIds: a.courseIds.map(Number),
    })),
  })
}

