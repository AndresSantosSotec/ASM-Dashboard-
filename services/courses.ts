import api from './api'

export interface Pensum {
  id: number
  codigo: string
  nombre: string
  area: 'comun' | 'especialidad' | 'cierre'
  creditos: number
  orden: number
  duracion_semanas: number
  prerequisitos: string[] | null
  descripcion: string | null
}

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
  pensumId?: number | null
}

export interface Course extends CourseInput {
  id: number
  status: 'draft' | 'approved' | 'synced'
  facilitator?: { id: number; name: string } | null
  programas: { id: number; nombre_del_programa: string }[]
  pensumId?: number | null
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
  pensumId: course.pensum_id ?? null,
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

/**
 * Obtiene cursos de un mes+año específico usando el filtro del backend.
 * El backend hace OR entre: start_date en el mes  o  nombre contiene "Mes Año".
 * Works for any future year (2026, 2027, ...). month is 0-based (JS Date convention).
 */
export const fetchCoursesForMonth = async (
  monthIndex: number,  // 0 = Enero, 11 = Diciembre
  year: number,
  programId?: number,
): Promise<Course[]> => {
  const params: Record<string, any> = {
    month: monthIndex + 1, // backend expects 1-12
    year,
    per_page: 200,
    page: 1,
  }
  if (programId) params.program_id = programId

  try {
    const res = await api.get('/courses', { params })
    const data = Array.isArray(res.data) ? res.data : res.data.data
    const courses = Array.isArray(data) ? data.map(mapCourseFromApi) : []
    console.log(`📅 fetchCoursesForMonth: ${courses.length} cursos para mes ${monthIndex + 1}/${year}`)
    return courses
  } catch (err) {
    console.error('❌ fetchCoursesForMonth error:', err)
    return []
  }
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

/**
 * Descarga un blob como archivo CSV
 * @param blob - Blob con el contenido del archivo
 * @param filename - Nombre del archivo a descargar
 */
export const downloadCSVFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Exporta y descarga automáticamente cursos de un estudiante
 * @param carnet - Carnet del estudiante
 * @returns Promise que se resuelve cuando la descarga se completa
 */
export const exportarYDescargarCursos = async (carnet: string): Promise<void> => {
  try {
    const blob = await exportCursosCSV(carnet)
    const filename = `cursos_${carnet.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`
    downloadCSVFile(blob, filename)
  } catch (error) {
    console.error('Error al exportar cursos:', error)
    throw error
  }
}

/**
 * Exporta y descarga automáticamente cursos de múltiples estudiantes
 * @param carnets - Array de carnets de estudiantes
 * @returns Promise que se resuelve cuando la descarga se completa
 */
export const exportarYDescargarCursosMasivo = async (carnets: string[]): Promise<void> => {
  try {
    const blob = await exportCursosMasivoCSV(carnets)
    const filename = `cursos_masivo_${new Date().toISOString().slice(0, 10)}.csv`
    downloadCSVFile(blob, filename)
  } catch (error) {
    console.error('Error al exportar cursos masivo:', error)
    throw error
  }
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

/**
 * Exporta cursos de un estudiante a CSV para importación a Moodle
 * @param carnet - Carnet del estudiante
 * @returns Blob con el archivo CSV
 */
export const exportCursosCSV = async (carnet: string): Promise<Blob> => {
  try {
    const res = await api.post('/courses/export-cursos', 
      { carnet }, 
      { 
        responseType: 'blob',
        headers: {
          'Accept': 'text/csv, application/json'
        }
      }
    )
    
    // Verificar el content-type de la respuesta
    const contentType = res.headers['content-type'] || res.headers['Content-Type']
    
    // Si la respuesta es JSON, es un error
    if (contentType && contentType.includes('application/json')) {
      const text = await res.data.text()
      const error = JSON.parse(text)
      throw new Error(error.error || error.message || 'Error al exportar cursos')
    }
    
    // Verificar si la respuesta es un blob JSON (error disfrazado)
    if (res.data.type === 'application/json') {
      const text = await res.data.text()
      const error = JSON.parse(text)
      throw new Error(error.error || error.message || 'Error al exportar cursos')
    }
    
    return res.data
  } catch (error: any) {
    // Manejar errores de respuesta HTTP
    if (error.response) {
      const status = error.response.status
      
      // Si es un blob de error JSON
      if (error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text()
          const jsonError = JSON.parse(text)
          throw new Error(jsonError.error || jsonError.message || `Error ${status}: ${text}`)
        } catch {
          throw new Error(`Error ${status} al exportar cursos`)
        }
      }
      
      // Si es un objeto JSON directo
      if (error.response.data && typeof error.response.data === 'object') {
        const errorData = error.response.data
        throw new Error(errorData.error || errorData.message || `Error ${status} al exportar cursos`)
      }
      
      throw new Error(`Error ${status} al exportar cursos`)
    }
    
    throw error
  }
}

/**
 * Exporta cursos de múltiples estudiantes a CSV para importación masiva a Moodle
 * @param carnets - Array de carnets de estudiantes
 * @returns Blob con el archivo CSV
 */
export const exportCursosMasivoCSV = async (carnets: string[]): Promise<Blob> => {
  try {
    const res = await api.post('/courses/export-cursos-masivo', 
      { carnets }, 
      { 
        responseType: 'blob',
        headers: {
          'Accept': 'text/csv, application/json'
        }
      }
    )
    
    // Verificar el content-type de la respuesta
    const contentType = res.headers['content-type'] || res.headers['Content-Type']
    
    // Si la respuesta es JSON, es un error
    if (contentType && contentType.includes('application/json')) {
      const text = await res.data.text()
      const error = JSON.parse(text)
      throw new Error(error.error || error.message || 'Error al exportar cursos masivo')
    }
    
    // Verificar si la respuesta es un blob JSON (error disfrazado)
    if (res.data.type === 'application/json') {
      const text = await res.data.text()
      const error = JSON.parse(text)
      throw new Error(error.error || error.message || 'Error al exportar cursos masivo')
    }
    
    // Verificar headers de información adicional (para logs)
    const totalProcesados = res.headers['x-total-procesados'] || res.headers['X-Total-Procesados']
    const totalErrores = res.headers['x-total-errores'] || res.headers['X-Total-Errores']
    
    if (totalProcesados && totalErrores) {
      console.log(`📊 Exportación masiva completada: ${totalProcesados} procesados, ${totalErrores} errores`)
    }
    
    return res.data
  } catch (error: any) {
    // Manejar errores de respuesta HTTP
    if (error.response) {
      const status = error.response.status
      
      // Si es un blob de error JSON
      if (error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text()
          const jsonError = JSON.parse(text)
          throw new Error(jsonError.error || jsonError.message || `Error ${status}: ${text}`)
        } catch {
          throw new Error(`Error ${status} al exportar cursos masivo`)
        }
      }
      
      // Si es un objeto JSON directo
      if (error.response.data && typeof error.response.data === 'object') {
        const errorData = error.response.data
        throw new Error(errorData.error || errorData.message || `Error ${status} al exportar cursos masivo`)
      }
      
      throw new Error(`Error ${status} al exportar cursos masivo`)
    }
    
    throw error
  }
}

/**
 * Obtener catálogo de pensum por programa
 */
export const fetchPensumByProgram = async (programId: number): Promise<Pensum[]> => {
  try {
    const res = await api.get(`/pensum/by-program/${programId}`)
    return res.data.data || []
  } catch (error) {
    console.error('Error al obtener pensum:', error)
    throw error
  }
}

/**
 * Obtener pensum disponible para un estudiante (filtra completados)
 */
export const fetchAvailablePensumForStudent = async (
  programId: number,
  studentId: number
): Promise<Pensum[]> => {
  try {
    const res = await api.get(`/pensum/available/${programId}/${studentId}`)
    return res.data.data || []
  } catch (error) {
    console.error('Error al obtener pensum disponible:', error)
    throw error
  }
}

/**
 * Crear curso desde pensum
 */
export const createCourseFromPensum = async (data: {
  pensumId: number
  startDate: string
  endDate: string
  schedule: string
  facilitatorId?: number | null
}): Promise<Course> => {
  try {
    const res = await api.post('/courses/from-pensum', {
      pensum_id: data.pensumId,
      start_date: data.startDate,
      end_date: data.endDate,
      schedule: data.schedule,
      facilitator_id: data.facilitatorId,
    })
    return mapCourseFromApi(res.data.course)
  } catch (error) {
    console.error('Error al crear curso desde pensum:', error)
    throw error
  }
}
