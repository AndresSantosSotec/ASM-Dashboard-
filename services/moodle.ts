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
  const payload = courses.map(course =>
    mapMoodleCoursePayload(mapMoodleCourse(course)),
  );
  // Log the payload so it can be inspected when syncing courses
  console.log('Sync Moodle payload:', JSON.stringify(payload, null, 2));
  await api.post('/courses/bulk-sync-moodle', payload);
};

/**
 * Checks which of the provided Moodle course IDs already exist in the backend.
 * Returns a list of Moodle IDs that are already synchronized.
 */
export const fetchSyncedMoodleIds = async (
  ids: number[],
): Promise<number[]> => {
  if (ids.length === 0) return [];
  const res = await api.get('/courses/check-moodle', {
    params: { moodle_ids: ids },
  });
  const data = Array.isArray(res.data) ? res.data : res.data.data;
  return data as number[];
};

export default moodleApi;
