const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Interfaces para respuestas de la API
 */

export interface MoodleCursoHistorico {
  course_id: number;
  course_name: string;
  course_code: string;
  course_summary: string | null;
  start_date: string;
  end_date: string | null;
  is_visible: number;
  total_estudiantes: number;
}

export interface MoodleCursosHistoricosResponse {
  success: boolean;
  total_cursos: number;
  meses_consultados: number;
  fecha_desde: string;
  cursos: MoodleCursoHistorico[];
}

export interface MoodleEstudianteCurso {
  user_id: number;
  carnet: string; // username en minúsculas
  nombre_completo: string;
  email: string;
  role_shortname: string;
  role_name: string;
  fecha_inscripcion: string;
  ultimo_acceso: string | null;
  curso_nombre: string;
}

export interface MoodleEstudiantesPorCursoResponse {
  success: boolean;
  course_id: number;
  total_estudiantes: number;
  estudiantes: MoodleEstudianteCurso[];
  carnets: string[]; // Carnets en mayúsculas
}

export interface MoodleEstudiantesMultiplesCursosResponse {
  success: boolean;
  total_cursos_consultados: number;
  total_estudiantes_unicos: number;
  estudiantes: Array<{
    user_id: number;
    carnet: string;
    nombre_completo: string;
    email: string;
    cursos_llevados: string; // Cursos separados por ' | '
    total_cursos_llevados: number;
  }>;
  carnets: string[];
}

// 🚀 OPTIMIZADO: Respuesta con cursos completados incluidos
export interface MoodleEstudiantesConCompletadosResponse {
  success: boolean;
  total_estudiantes_unicos: number;
  total_con_equivalente_interno: number;
  total_cursos_completados: number;
  carnets: string[];
  estudiantes: Array<{
    moodle_user_id: number;
    carnet: string;
    nombre_completo: string;
    email: string;
    cursos_llevados: string;
    total_cursos_llevados: number;
    tiene_equivalente_interno: boolean;
    estudiante_interno: {
      id: number;
      carnet: string;
      nombre_completo: string;
      correo: string;
      programas: Array<{ id: number; nombre: string }>;
    } | null;
    cursos_completados_sistema: Array<{
      id: string;
      name: string;
      code: string;
      start_date: string;
    }>;
    cursos_aprobados_moodle: Array<{
      courseid: number;
      coursename: string;
      courseshortname: string;
      finalgrade: number;
      grademax: number;
      gradepass: number;
    }>;
  }>;
}

/**
 * Obtener cursos de Moodle de los últimos N meses
 * 
 * @param meses - Número de meses atrás a consultar (default: 6)
 * @returns Lista de cursos históricos
 */
export async function fetchMoodleCursosHistoricos(
  meses: number = 6
): Promise<MoodleCursosHistoricosResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay token de autenticación");

  const response = await fetch(
    `${API_URL}/moodle/cursos/historico?meses=${meses}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Error al obtener cursos: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Obtener estudiantes que llevaron un curso específico
 * 
 * @param courseId - ID del curso en Moodle
 * @returns Lista de estudiantes con sus carnets
 */
export async function fetchMoodleEstudiantesPorCurso(
  courseId: number
): Promise<MoodleEstudiantesPorCursoResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay token de autenticación");

  const response = await fetch(
    `${API_URL}/moodle/cursos/${courseId}/estudiantes`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Error al obtener estudiantes: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Obtener estudiantes de múltiples cursos (combinados)
 * 
 * @param courseIds - Array de IDs de cursos en Moodle
 * @returns Lista de estudiantes únicos con sus cursos llevados
 */
export async function fetchMoodleEstudiantesMultiplesCursos(
  courseIds: number[]
): Promise<MoodleEstudiantesMultiplesCursosResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay token de autenticación");

  const response = await fetch(
    `${API_URL}/moodle/cursos/estudiantes-multiples`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ course_ids: courseIds }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Error al obtener estudiantes: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * 🚀 OPTIMIZADO: Obtener estudiantes con TODOS sus cursos completados en UNA sola llamada
 * 
 * Esta función reemplaza múltiples llamadas separadas por UN SOLO endpoint que:
 * - Obtiene estudiantes de Moodle
 * - Busca equivalentes internos
 * - Carga cursos completados del sistema
 * - Carga cursos aprobados de Moodle
 * 
 * Reduce N+1 queries a solo 3 queries en backend (MySQL + PostgreSQL)
 * 
 * @param courseIds - Array de IDs de cursos en Moodle
 * @returns Estudiantes con todos sus cursos completados incluidos
 */
export async function fetchMoodleEstudiantesConCompletados(
  courseIds: number[]
): Promise<MoodleEstudiantesConCompletadosResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay token de autenticación");

  const response = await fetch(
    `${API_URL}/moodle/cursos/estudiantes-con-completados`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ course_ids: courseIds }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("❌ Error en fetchMoodleEstudiantesConCompletados:", {
      status: response.status,
      statusText: response.statusText,
      errorData,
      courseIds,
    });
    throw new Error(
      errorData.message || errorData.error || `Error al obtener estudiantes: ${response.statusText}`
    );
  }

  return response.json();
}
