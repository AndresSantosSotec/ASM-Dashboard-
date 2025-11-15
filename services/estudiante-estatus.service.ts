import api from './api'

// ====================================
// TIPOS
// ====================================

export interface Student {
  id: string
  name: string
  carnet: string
  email: string
  program: string
  programCode: string
  enrollmentDate: string
  status: "active" | "inactive" | "graduated" | "on_leave"
  academicInfo: {
    coursesApproved: number
    coursesFailed: number
    coursesInProgress: number
    totalCourses: number
    credits: {
      completed: number
      total: number
    }
    gpa: number
    semester: number
  }
  financialInfo: {
    enrollmentFee: number
    monthlyFee: number
    pendingPayments: number
    totalDebt: number
    lastPaymentDate: string | null
    nextPaymentDate: string | null
    paymentStatus: "up_to_date" | "pending" | "overdue"
  }
}

export interface Course {
  id: string
  name: string
  code: string
  credits: number
  period: string
  status: "approved" | "failed" | "in_progress" | "pending"
  grade: number | null
  professor: string
  startDate: string
  endDate: string | null
}

export interface Payment {
  id: string
  concept: string
  amount: number
  date: string | null
  dueDate: string
  status: "paid" | "pending" | "overdue"
  paidAmount: number | null
}

// ====================================
// FUNCIONES DE API
// ====================================

/**
 * Obtener información completa del estudiante autenticado o por ID
 * @param prospectoId - ID del prospecto (opcional, para administradores)
 */
export async function fetchEstudianteEstatusCompleto(prospectoId?: string): Promise<Student> {
  const params = prospectoId ? { prospecto_id: prospectoId } : {}
  const response = await api.get('/estudiantes/estatus-completo', { params })
  return response.data.data
}

/**
 * Obtener lista detallada de cursos del estudiante
 * @param prospectoId - ID del prospecto (opcional, para administradores)
 */
export async function fetchCursosDetallados(prospectoId?: string): Promise<Course[]> {
  const params = prospectoId ? { prospecto_id: prospectoId } : {}
  const response = await api.get('/estudiantes/cursos-detallados', { params })
  return response.data.data
}

/**
 * Obtener historial de pagos del estudiante
 * @param prospectoId - ID del prospecto (opcional, para administradores)
 */
export async function fetchHistorialPagos(prospectoId?: string): Promise<Payment[]> {
  const params = prospectoId ? { prospecto_id: prospectoId } : {}
  const response = await api.get('/estudiantes/historial-pagos', { params })
  return response.data.data
}

/**
 * Buscar estudiantes (para administradores)
 * Esta función reutiliza el endpoint de prospectos inscritos
 */
export async function fetchEstudiantesInscritos(): Promise<Array<{
  id: string
  name: string
  program: string
  carnet: string
  email: string
}>> {
  const response = await api.get('/prospectos?estatus=INSCRITO')
  
  return response.data.data.map((p: any) => ({
    id: String(p.id),
    name: p.nombre_completo,
    program: p.programa?.nombre_del_programa || 'Sin programa',
    carnet: p.carnet,
    email: p.correo_electronico
  }))
}

/**
 * Obtener estatus de un estudiante específico (para administradores)
 * Nota: Esta función requiere autenticación como administrador
 */
export async function fetchEstudianteByCarnet(carnet: string): Promise<Student> {
  // Por ahora usaremos el endpoint del usuario autenticado
  // Si se necesita consultar otros estudiantes, se debe crear un endpoint admin
  const response = await api.get('/estudiantes/estatus-completo')
  return response.data.data
}
