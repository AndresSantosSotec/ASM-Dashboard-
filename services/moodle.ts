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
}

export const mapMoodleCourse = (course: any): MoodleCourse => ({
  id: course.id,
  fullname: course.fullname,
  shortname: course.shortname,
  summary: course.summary ?? '',
  categoryid: course.categoryid,
  numsections: course.numsections,
})

export const fetchMoodleCourses = async (): Promise<any[]> => {
  const params = {
    wstoken: MOODLE_TOKEN,
    wsfunction: 'core_course_get_courses',
    moodlewsrestformat: MOODLE_FORMAT,
  };

  try {
    const res = await moodleApi.get('', { params });
    return Array.isArray(res.data) ? res.data : res.data.courses || [];
  } catch (err) {
    // Si falla en la URL principal, intento con la IP
    if (moodleApiIp) {
      try {
        const res = await moodleApiIp.get('', { params });
        return Array.isArray(res.data) ? res.data : res.data.courses || [];
      } catch (errIp) {
        throw errIp;
      }
    }
    throw err;
  }
};

export const pushMoodleCourses = async (courses: any[]): Promise<void> => {
  const payload = courses.map(mapMoodleCourse);
  await api.post('/courses/bulk-sync-moodle', payload);
};

export default moodleApi;
