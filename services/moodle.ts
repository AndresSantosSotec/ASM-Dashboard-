
import axios, { AxiosError } from 'axios'

const MOODLE_BASE_URL =
  process.env.NEXT_PUBLIC_MOODLE_URL || 'https://campusamerican.com'
const MOODLE_IP_URL = process.env.NEXT_PUBLIC_MOODLE_IP_URL || ''

const MOODLE_TOKEN = process.env.NEXT_PUBLIC_MOODLE_TOKEN || ''
const MOODLE_FORMAT = process.env.NEXT_PUBLIC_MOODLE_FORMAT || 'json'

const moodleApi = axios.create({

  baseURL: `${MOODLE_BASE_URL}/webservice/rest/server.php`,
})

const moodleApiIp = MOODLE_IP_URL
  ? axios.create({ baseURL: `${MOODLE_IP_URL}/webservice/rest/server.php` })
  : null

export const fetchMoodleCourses = async () => {
  const params = {
    wstoken: MOODLE_TOKEN,
    wsfunction: 'core_course_get_courses',
    moodlewsrestformat: MOODLE_FORMAT,
  }
  try {
    const res = await moodleApi.get('', { params })

    // ← Aquí ves toda la respuesta cruda de Moodle
    console.log('📚 Moodle API response:', res.data)

    return Array.isArray(res.data)
      ? res.data
      : res.data.courses || []
  } catch (err) {
    console.error('❌ Error en moodleApi, intentando IP fallback:', err)
    if (moodleApiIp) {
      try {
        const resIp = await moodleApiIp.get('', { params })

        // ← Y aquí la respuesta desde la IP alternativa
        console.log('📚 Moodle IP API response:', resIp.data)

        return Array.isArray(resIp.data)
          ? resIp.data
          : resIp.data.courses || []
      } catch (errIp) {
        console.error('❌ Error en moodleApiIp:', errIp)
        throw errIp
      }
    }
    throw err
  }
}


export default moodleApi

