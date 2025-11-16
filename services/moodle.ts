import axios, { AxiosError } from 'axios';
import api from './api';

export const MOODLE_BASE_URL =
  process.env.NEXT_PUBLIC_MOODLE_URL || 'https://campusamerican.com';
export const MOODLE_IP_URL =
  process.env.NEXT_PUBLIC_MOODLE_IP_URL || '';
export const MOODLE_TOKEN =
  process.env.NEXT_PUBLIC_MOODLE_TOKEN || '';
export const MOODLE_FORMAT =
  process.env.NEXT_PUBLIC_MOODLE_FORMAT || 'json';

const moodleApi = axios.create({
  baseURL: `${MOODLE_BASE_URL}/webservice/rest/server.php`,
});

const moodleApiIp = MOODLE_IP_URL
  ? axios.create({ baseURL: `${MOODLE_IP_URL}/webservice/rest/server.php` })
  : null;

export interface MoodleCourse {
  id: number
  fullname: string
  shortname: string
  summary?: string
  categoryid?: number
  numsections?: number
  // When fetched from Moodle the creation time is provided as a Unix
  // timestamp. It's optional here because not every call includes it.
  timecreated?: number
}

// Payload shape expected by the backend when synchronising courses. The
// `moodle_id` field is used as the primary identifier in the Laravel API and
// an `origen` value of "moodle" indicates the source of the data.
interface MoodleCoursePayload {
  moodle_id: number
  fullname: string
  shortname: string
  summary?: string
  categoryid?: number
  numsections?: number
  origen: string
}

export const mapMoodleCourse = (course: any): MoodleCourse => ({
  id: course.id,
  fullname: course.fullname,
  shortname: course.shortname,
  summary: course.summary ?? '',
  categoryid: course.categoryid,
  numsections: course.numsections,
  timecreated: course.timecreated,
})

/**
 * Converts a Moodle course object into the structure expected by the backend
 * when synchronising. Additional metadata like `moodle_id` and `origen` are
 * added here.
 */
const mapMoodleCoursePayload = (course: MoodleCourse): MoodleCoursePayload => ({
  moodle_id: course.id,
  fullname: course.fullname,
  shortname: course.shortname,
  summary: course.summary ?? '',
  categoryid: course.categoryid,
  numsections: course.numsections,
  origen: 'moodle',
})

export const fetchMoodleCourses = async (): Promise<any[]> => {
  // DIAGNÓSTICO CRÍTICO: Verificar que el token esté disponible
  if (!MOODLE_TOKEN || MOODLE_TOKEN.trim() === '') {
    const errorMsg = '❌ MOODLE_TOKEN no está configurado o está vacío. ' +
      'Asegúrate de que NEXT_PUBLIC_MOODLE_TOKEN esté en .env y reinicia el servidor (npm run dev)';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const params = {
    wstoken: MOODLE_TOKEN,
    wsfunction: 'core_course_get_courses',
    moodlewsrestformat: MOODLE_FORMAT,
  };

  console.log('🔄 Iniciando petición a Moodle Web Services...')
  console.log('📍 Base URL:', MOODLE_BASE_URL)
  console.log('🔑 Token:', MOODLE_TOKEN ? `${MOODLE_TOKEN.substring(0, 10)}...` : 'NO CONFIGURADO')
  console.log('📋 Parámetros:', params)

  try {
    console.log('🌐 Intentando con URL principal:', moodleApi.defaults.baseURL)
    const res = await moodleApi.get('', { params });
    
    console.log('✅ Respuesta recibida:', {
      status: res.status,
      dataType: typeof res.data,
      isArray: Array.isArray(res.data),
      hasCourses: res.data?.courses ? true : false,
      dataKeys: Object.keys(res.data || {}),
    })
    
    // Verificar si hay un error en la respuesta de Moodle
    if (res.data?.exception) {
      console.error('❌ Error de Moodle:', res.data)
      
      // Errores específicos con mensajes claros
      const errorCode = res.data.errorcode || res.data.exception;
      let userMessage = res.data.message || 'Error desconocido de Moodle';
      
      if (errorCode === 'accessexception') {
        userMessage = '⛔ El token no tiene permisos para obtener cursos. ' +
          'Ve a Moodle → Servicios externos → Añade la función "core_course_get_courses"';
      } else if (errorCode === 'invalidtoken') {
        userMessage = '🔑 Token inválido o expirado. Genera un nuevo token en Moodle.';
      }
      
      throw new Error(userMessage)
    }
    
    // Detectar errores sin exception flag
    if (res.data?.errorcode) {
      console.error('❌ Error con código:', res.data.errorcode)
      throw new Error(res.data.message || `Error de Moodle: ${res.data.errorcode}`)
    }
    
    const courses = Array.isArray(res.data) ? res.data : res.data.courses || [];
    console.log(`✅ ${courses.length} cursos obtenidos`)
    
    // DIAGNÓSTICO: Ver estructura de los primeros cursos
    if (courses.length > 0) {
      console.log('📋 Ejemplo de curso:', courses[0]);
      console.log('🔑 Campos timecreated de primeros 3 cursos:', 
        courses.slice(0, 3).map((c: any) => ({
          id: c.id,
          name: c.fullname?.substring(0, 30),
          timecreated: c.timecreated,
          fecha: c.timecreated ? new Date(c.timecreated * 1000).toISOString() : 'SIN FECHA'
        }))
      );
    }
    
    return courses;
  } catch (err: any) {
    console.error('❌ Error con URL principal:', err.message)
    
    // Si falla en la URL principal, intento con la IP
    if (moodleApiIp) {
      try {
        console.log('🔄 Intentando con URL alternativa (IP):', moodleApiIp.defaults.baseURL)
        const res = await moodleApiIp.get('', { params });
        
        console.log('✅ Respuesta desde IP recibida:', {
          status: res.status,
          dataType: typeof res.data,
        })
        
        // Verificar si hay un error en la respuesta de Moodle
        if (res.data?.exception) {
          console.error('❌ Error de Moodle (IP):', res.data)
          
          const errorCode = res.data.errorcode || res.data.exception;
          let userMessage = res.data.message || 'Error desconocido de Moodle';
          
          if (errorCode === 'accessexception') {
            userMessage = '⛔ El token no tiene permisos. Añade "core_course_get_courses" al servicio web.';
          } else if (errorCode === 'invalidtoken') {
            userMessage = '🔑 Token inválido. Genera uno nuevo.';
          }
          
          throw new Error(userMessage)
        }
        
        if (res.data?.errorcode) {
          throw new Error(res.data.message || `Error: ${res.data.errorcode}`)
        }
        
        const courses = Array.isArray(res.data) ? res.data : res.data.courses || [];
        console.log(`✅ ${courses.length} cursos obtenidos desde IP`)
        
        return courses;
      } catch (errIp: any) {
        console.error('❌ Error con URL alternativa:', errIp.message)
        throw errIp;
      }
    }
    
    console.error('❌ No hay URL alternativa configurada')
    throw err;
  }
};

export const pushMoodleCourses = async (courses: any[]): Promise<void> => {
  const payload = courses.map(course =>
    mapMoodleCoursePayload(mapMoodleCourse(course)),
  );
  // Log the payload so it can be inspected when syncing courses
  console.log('Sync Moodle payload:', JSON.stringify(payload, null, 2));
  await api.post('/courses/bulk-sync-moodle', payload);
};

export default moodleApi;
