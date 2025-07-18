import axios from 'axios'

const MOODLE_BASE_URL = process.env.NEXT_PUBLIC_MOODLE_URL || 'https://campusamerican.com'
const MOODLE_TOKEN = process.env.NEXT_PUBLIC_MOODLE_TOKEN || ''
const MOODLE_FORMAT = process.env.NEXT_PUBLIC_MOODLE_FORMAT || 'json'

const moodleApi = axios.create({
  baseURL: MOODLE_BASE_URL,
})

export interface MoodleCourse {
  id: number
  fullname: string
  shortname: string
  idnumber?: string
  summary?: string
}

export const fetchMoodleCourses = async (): Promise<MoodleCourse[]> => {
  const params = new URLSearchParams({
    wstoken: MOODLE_TOKEN,
    wsfunction: 'core_course_get_courses',
    moodlewsrestformat: MOODLE_FORMAT,
  })

  const res = await moodleApi.get(`/webservice/rest/server.php?${params.toString()}`)
  const data = res.data

  if (Array.isArray(data)) return data as MoodleCourse[]
  if (Array.isArray(data.courses)) return data.courses as MoodleCourse[]
  return []
}
