import axios from 'axios'

const MOODLE_BASE_URL = process.env.NEXT_PUBLIC_MOODLE_URL || 'https://campusamerican.com'
const MOODLE_TOKEN = process.env.NEXT_PUBLIC_MOODLE_TOKEN || ''
const MOODLE_FORMAT = process.env.NEXT_PUBLIC_MOODLE_FORMAT || 'json'

const moodleApi = axios.create({
  baseURL: `${MOODLE_BASE_URL}/webservice/rest/server.php`,
})

export const fetchMoodleCourses = async () => {
  const res = await moodleApi.get('', {
    params: {
      wstoken: MOODLE_TOKEN,
      wsfunction: 'core_course_get_courses',
      moodlewsrestformat: MOODLE_FORMAT,
    },
  })
  return Array.isArray(res.data) ? res.data : res.data.courses || []
}

export default moodleApi
