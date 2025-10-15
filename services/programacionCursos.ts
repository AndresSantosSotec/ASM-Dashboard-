import api from './api'

export interface ProgramacionCurso {
  courseid: number
  coursename: string
  fecha_inicio: string
  fecha_fin: string
  dia_semana: string
  mes: string
  anio: string
}

/**
 * Obtiene la programación de cursos desde Moodle
 * Los datos incluyen información sobre fechas, días de la semana, mes y año
 */
export const fetchProgramacionCursos = async (): Promise<ProgramacionCurso[]> => {
  const res = await api.get('/moodle/programacion-cursos')
  const data = Array.isArray(res.data.data) ? res.data.data : res.data
  return data as ProgramacionCurso[]
}

/**
 * Organiza los cursos por mes y año
 */
export const organizeCoursesByMonth = (courses: ProgramacionCurso[]) => {
  const coursesByMonth: { [key: string]: ProgramacionCurso[] } = {}
  
  courses.forEach(course => {
    const key = `${course.mes} ${course.anio}`
    if (!coursesByMonth[key]) {
      coursesByMonth[key] = []
    }
    coursesByMonth[key].push(course)
  })
  
  return coursesByMonth
}

/**
 * Obtiene los meses únicos de los cursos
 */
export const getUniqueMonths = (courses: ProgramacionCurso[]): string[] => {
  const monthsSet = new Set<string>()
  courses.forEach(course => {
    if (course.mes !== 'SIN MES' && course.anio !== 'SIN AÑO') {
      monthsSet.add(`${course.mes} ${course.anio}`)
    }
  })
  return Array.from(monthsSet).sort((a, b) => {
    const [mesA, anioA] = a.split(' ')
    const [mesB, anioB] = b.split(' ')
    
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    
    if (anioA !== anioB) {
      return parseInt(anioA) - parseInt(anioB)
    }
    return meses.indexOf(mesA) - meses.indexOf(mesB)
  })
}

export default fetchProgramacionCursos
