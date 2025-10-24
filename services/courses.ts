import api from './api'

export interface CourseInput {
  name: string
  code: string
  area: 'common' | 'specialty' | 'closure'
  credits: number
  startDate: string
  endDate: string
  schedule: string
  duration: string
  programIds: number[]
  facilitatorId?: number | null
}

export interface Course extends CourseInput {
  id: number
  status: 'draft' | 'approved' | 'synced'
  facilitator?: { id: number; name: string } | null
  programas: { id: number; nombre_del_programa: string }[]
}

const mapCourseFromApi = (course: any): Course => ({
  id: course.id,
  name: course.name,
  code: course.code,
  area: course.area,
  credits: course.credits,
  startDate: course.start_date,
  endDate: course.end_date,
  schedule: course.schedule,
  duration: course.duration,
  programIds: Array.isArray(course.programas)
    ? course.programas.map((p: any) => p.id)
    : [],
  facilitatorId: course.facilitator_id ?? null,
  status: course.status,
  facilitator: course.facilitator ?? null,
  programas: course.programas ?? [],
})

const mapCourseToApi = (data: Partial<CourseInput> & { status?: Course['status'] }) => {
  const payload: Record<string, any> = {}
  if (data.name !== undefined) payload.name = data.name
  if (data.code !== undefined) payload.code = data.code
  if (data.area !== undefined) payload.area = data.area
  if (data.credits !== undefined) payload.credits = data.credits
  if (data.startDate !== undefined) payload.start_date = data.startDate
  if (data.endDate !== undefined) payload.end_date = data.endDate
  if (data.schedule !== undefined) payload.schedule = data.schedule
  if (data.duration !== undefined) payload.duration = data.duration
  if (data.programIds !== undefined) payload.program_ids = data.programIds
  if (data.facilitatorId !== undefined) payload.facilitator_id = data.facilitatorId
  if ((data as any).status !== undefined) payload.status = (data as any).status
  return payload
}

export const fetchCourses = async (programId?: number) => {
  const perPage = 200
  let page = 1
  const courses: Course[] = []
  const baseParams = programId ? { program_id: programId } : {}
  const maxPages = 50 // PROTECCIÓN: Máximo 10,000 cursos (50 páginas × 200)

  while (page <= maxPages) {
    console.log(`📥 Cargando cursos página ${page}...`);
    
    try {
      const res = await api.get('/courses', {
        params: { ...baseParams, per_page: perPage, page },
      })
      const data = Array.isArray(res.data) ? res.data : res.data.data
      
      console.log(`✅ Página ${page}: ${data.length} cursos recibidos`);
      
      if (!data || data.length === 0) {
        console.log('🏁 No hay más cursos');
        break
      }
      
      courses.push(...data.map(mapCourseFromApi))

      // Si recibimos menos de perPage, es la última página
      if (data.length < perPage) {
        console.log(`🏁 Última página alcanzada (${data.length} < ${perPage})`);
        break
      }
      
      page++
    } catch (err) {
      console.error(`❌ Error cargando página ${page}:`, err);
      break
    }
  }

  if (page > maxPages) {
    console.warn('⚠️ Se alcanzó el límite máximo de páginas');
  }

  console.log(`📊 Total de cursos cargados: ${courses.length}`);
  return courses
}

export const fetchProgramCourses = async (programId: number) => {
  return fetchCourses(programId)
}

/**
 * Fetches all courses for the given program IDs using a single request.
 * This helps reduce the number of API calls when multiple programs are needed.
 */
export const fetchCoursesForPrograms = async (
  programIds: number[],
): Promise<Course[]> => {

  const ids = Array.from(new Set(programIds)).filter((id) => id > 0)
  if (ids.length === 0) return []

  const chunkSize = 100
  const allCourses: Course[] = []

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize)
    const res = await api.post('/courses/by-programs', {
      params: { program_ids: chunk },
    })
    const data = Array.isArray(res.data) ? res.data : res.data.data
    allCourses.push(...data.map(mapCourseFromApi))
  }

  return Array.from(new Map(allCourses.map((c: Course) => [c.id, c])).values())

}

export const fetchStudentCourses = async (studentId: string): Promise<Course[]> => {
  const res = await api.get(`/estudiante-programa/${studentId}/with-courses`)
  const data = Array.isArray(res.data) ? res.data : res.data.data
  const courses: Course[] = []
  const unique = new Map<number, Course>()
  data.forEach((ep: any) => {
    if (ep.programa && Array.isArray(ep.programa.courses)) {
      ep.programa.courses.forEach((c: any) => {
        const mapped = mapCourseFromApi(c)
        unique.set(mapped.id, mapped)
      })
    }
  })

  unique.forEach((c: Course) => courses.push(c))

  return courses
}

export const createCourse = async (data: CourseInput) => {
  const payload = mapCourseToApi(data)
  const res = await api.post('/courses', payload)
  return mapCourseFromApi(res.data)
}

export const updateCourse = async (
  id: number,
  data: Partial<CourseInput> & { status?: Course['status'] },
) => {
  const payload = mapCourseToApi(data)
  const res = await api.put(`/courses/${id}`, payload)
  return mapCourseFromApi(res.data)
}

export const deleteCourse = async (id: number) => {
  await api.delete(`/courses/${id}`)
}

export const approveCourse = async (id: number) => {
  const res = await api.post(`/courses/${id}/approve`)
  return mapCourseFromApi(res.data)
}

export const syncCourseToMoodle = async (id: number) => {
  const res = await api.post(`/courses/${id}/sync-moodle`)
  return mapCourseFromApi(res.data)
}

export const assignFacilitator = async (
  id: number,
  facilitatorId: number | null,
) => {
  const res = await api.post(`/courses/${id}/assign-facilitator`, {
    facilitator_id: facilitatorId,
  })
  return mapCourseFromApi(res.data)
}

export const fetchFacilitators = async () => {
  const res = await api.get('/users/role/2')
  return res.data
}


/** Llama a GET /available-for-students?prospecto_ids[]=1&prospecto_ids[]=2 */
export const getAvailableCoursesForStudents = async (
  prospectoIds: string[]
): Promise<Course[]> => {

  const res = await api.get<unknown[]>('/courses/available-for-students', {
    params: { prospecto_ids: prospectoIds.map(Number) },
  })

  const raw = Array.isArray(res.data) ? res.data : (res.data as any).data
  const mapped: Course[] = (raw as any[]).map((c: any) => mapCourseFromApi(c))
  return Array.from(new Map(mapped.map((c: Course) => [c.id, c])).values())
}
