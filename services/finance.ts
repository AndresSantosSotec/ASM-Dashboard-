// services/finance.ts
import api from "./api"
import type { LatePaymentsResponse as LatePaymentsResponseType } from "@/types/collections"

/* =========================
   Tipos compartidos
========================= */

export interface DashboardSummary {
  ingresosMensuales: number
  ingresosMesAnterior: number
  tasaMorosidad: number
  tasaMorosidadAnterior: number
  recaudacionPendiente: number
  recaudacionPendienteAnterior: number
  estudiantesActivos: number
  estudiantesActivosAnterior: number
}

export interface ProspectoContact {
  id: number
  nombre_completo?: string
  telefono?: string | null
  telefono_corporativo?: string | null
  correo_electronico?: string | null
  correo_corporativo?: string | null
  programas?: Array<{ programa?: { nombre_del_programa?: string } }>
}

/** Tipos mínimos para colecciones; si ya los tienes en '@/types/collections',
 *  borra estas interfaces y usa tus imports. */
export type LatePaymentsBucket = "all" | "b1" | "b2" | "b3" | "b4"
export interface LatePaymentsQuery {
  q?: string
  bucket?: LatePaymentsBucket
  programa_id?: number | string
  empresa?: string // 🆕 Filtro por empresa donde labora
  per_page?: number
  page?: number
}
export interface LatePaymentRow {
  id: number              // EP id (row id)
  studentId: number
  name: string
  program: string
  totalDebt: number
  lateMonths: number
  daysLate: number
  bucket: "B1" | "B2" | "B3" | "B4"
  status: "activo" | "bloqueado"
  lastContact?: string | null
  promiseDate?: string | null
}
export interface PaginationMeta {
  total: number
  per_page: number
  current_page: number
  last_page: number
}
export interface LatePaymentsResponse {
  data: LatePaymentRow[]
  meta: PaginationMeta
  summary?: {
    total_cuotas: number
    total_deuda_original: number
    total_mora: number
    total_con_mora: number
    estudiantes_unicos: number
  }
}
export interface StudentSnapshot {
  prospectoId: any
  ep: any
  epId: number
  studentId: number
  studentName: string
  programName: string
  balance: number
  dueInstallments: Array<{
    id: number
    due_date: string
    amount_due: number
    amount_paid: number
  }>
  lastContacts?: Array<{
    id: number
    date: string
    channel: string
    notes: string
  }>
}

/* =========================
   Dashboard / Reportes
========================= */

export const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  const res = await api.get("/reports/summary")
  return Array.isArray(res.data) ? res.data[0] : res.data
}

export const exportFinancialReport = async (
  format: "pdf" | "excel",
  queue?: boolean,
) => {
  const res = await api.get("/reports/export", {
    params: { format, ...(queue ? { queue: 1 } : {}) },
    responseType: queue ? "json" : "blob",
  })
  return res.data
}



/** Variante simple (compatibilidad) */
export const fetchDashboardFinanciero = async (params?: any) => {
  const res = await api.get("/dashboard-financiero", { params })
  return res.data
}

/* =========================
   Invoices
========================= */

export const getInvoices = async (params?: any) => {
  const res = await api.get("/invoices", { params })
  return res.data
}

export const createInvoice = async (data: any) => {
  const res = await api.post("/invoices", data)
  return res.data
}

export const updateInvoice = async (id: string | number, data: any) => {
  const res = await api.put(`/invoices/${id}`, data)
  return res.data
}

export const deleteInvoice = async (id: string | number) => {
  const res = await api.delete(`/invoices/${id}`)
  return res.data
}

/* =========================
   Payments
========================= */

/** Compatibilidad: devuelve tal cual lo que entregue el backend */
export const getPayments = async (params?: any) => {
  const res = await api.get("/payments", { params })
  return res.data
}

/** Lista paginada de pagos con filtros (para módulo de colecciones) */
export const listPayments = async (params: {
  status?: "aprobado" | "pendiente" | "rechazado"
  method?: string
  program_id?: number | string
  q?: string
  fecha_inicio?: string
  fecha_fin?: string
  page?: number
  per_page?: number
  sort?: string
} = {}) => {
  const res = await api.get("/payments", { params })
  const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
  const meta: PaginationMeta = res.data?.meta ?? {
    total: data.length,
    per_page: params.per_page ?? data.length,
    current_page: params.page ?? 1,
    last_page: 1,
  }
  return { data, meta }
}

export const fetchRecentPayments = async (limit = 5) => {
  const res = await api.get("/payments", { params: { per_page: limit } })
  // Manejar nueva estructura paginada del backend
  const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
  return Array.isArray(data) ? data.slice(0, limit) : []
}

export const createPayment = async (data: any) => {
  const res = await api.post("/payments", data)
  return res.data
}

/* =========================
   Reconciliación bancaria
========================= */

export const getPendingReconciliation = async () => {
  const res = await api.get("/reconciliation/pending")
  return res.data
}

export const uploadReconciliation = async (data: FormData) => {
  const res = await api.post("/reconciliation/upload", data, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data
}

export const processReconciliation = async () => {
  const res = await api.post("/reconciliation/process")
  return res.data
}

/* =========================
   Reglas de Pago
========================= */

export const getPaymentRules = async () => {
  const res = await api.get("/payment-rules")
  return res.data
}

export const getCurrentPaymentRule = async () => {
  const res = await api.get("/payment-rules-current")
  return res.data
}

export const getPaymentRuleById = async (id: string | number) => {
  const res = await api.get(`/payment-rules/${id}`)
  return res.data
}

export const createPaymentRule = async (data: any) => {
  const res = await api.post("/payment-rules", data)
  return res.data
}

export const updatePaymentRules = async (id: string | number, data: any) => {
  const res = await api.put(`/payment-rules/${id}`, data)
  return res.data
}

/* ===== Notificaciones (Reglas de Pago) ===== */

export const fetchNotificationRulesByRule = async (ruleId: string | number) => {
  const res = await api.get(`/payment-rules/${ruleId}/notifications`)
  const list = Array.isArray(res.data) ? res.data : res.data?.data
  return Array.isArray(list) ? list : []
}

export const createNotificationRule = async (ruleId: string | number, data: any) => {
  const payload: any = {}
  if (data.type !== undefined) payload.type = data.type
  if (data.triggerDays !== undefined) payload.offset_days = Number(data.triggerDays)
  if (data.message !== undefined) payload.message = data.message
  const res = await api.post(`/payment-rules/${ruleId}/notifications`, payload)
  return res.data
}

export const importKardexPagos = async (file: File, tipoArchivo: string = 'cardex_directo') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('tipo_archivo', tipoArchivo)
  
  const res = await api.post('/importar-pagos-kardex', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data
}

export const updateNotificationRule = async (
  ruleId: string | number,
  notificationId: string | number,
  data: any,
) => {
  const payload: any = {}
  if (data.type !== undefined) payload.type = data.type
  if (data.triggerDays !== undefined) payload.offset_days = Number(data.triggerDays)
  if (data.message !== undefined) payload.message = data.message
  const res = await api.put(`/payment-rules/${ruleId}/notifications/${notificationId}`, payload)
  return res.data
}

export const deleteNotificationRule = async (
  ruleId: string | number,
  notificationId: string | number,
) => {
  const res = await api.delete(`/payment-rules/${ruleId}/notifications/${notificationId}`)
  return res.data
}

/* =========================
   Reglas de Bloqueo (Blocking)
========================= */

export const fetchBlockingRulesByRule = async (ruleId: string | number) => {
  const res = await api.get(`/payment-rules/${ruleId}/blocking-rules`)
  const list = Array.isArray(res.data) ? res.data : res.data?.data
  return Array.isArray(list) ? list : []
}

export const createBlockingRule = async (ruleId: string | number, data: any) => {
  if (!ruleId || isNaN(Number(ruleId))) {
    throw new Error("ID de regla de pago inválido")
  }
  const payload = {
    name: data.name?.trim(),
    description: data.description,
    days_after_due: Number(data.daysAfterDue),
    affected_services: Array.isArray(data.services) ? data.services : [],
    active: !!data.active,
  }
  if (!payload.name) throw new Error("El nombre es requerido")
  if (isNaN(payload.days_after_due) || payload.days_after_due <= 0) {
    throw new Error("Los días después del vencimiento deben ser mayores a cero")
  }
  if (payload.affected_services.length === 0) {
    throw new Error("Debe seleccionar al menos un servicio")
  }
  const validServices = ["plataforma", "evaluaciones", "materiales"]
  const invalid = payload.affected_services.filter((s: string) => !validServices.includes(s))
  if (invalid.length > 0) throw new Error(`Servicios inválidos: ${invalid.join(", ")}`)
  const res = await api.post(`/payment-rules/${ruleId}/blocking-rules`, payload)
  return res.data
}

export const updateBlockingRule = async (
  ruleId: string | number,
  blockingRuleId: string | number,
  data: any,
) => {
  const payload: any = {}
  if (data.name !== undefined) payload.name = data.name
  if (data.description !== undefined) payload.description = data.description
  if (data.daysAfterDue !== undefined) payload.days_after_due = Number(data.daysAfterDue)
  if (data.services !== undefined) payload.affected_services = data.services
  if (data.active !== undefined) payload.active = !!data.active
  const res = await api.put(`/payment-rules/${ruleId}/blocking-rules/${blockingRuleId}`, payload)
  return res.data
}

export const deleteBlockingRule = async (
  ruleId: string | number,
  blockingRuleId: string | number,
) => {
  const res = await api.delete(`/payment-rules/${ruleId}/blocking-rules/${blockingRuleId}`)
  return res.data
}

/* =========================
   Gateways de Pago
========================= */

export const getPaymentGateways = async (params?: any) => {
  const res = await api.get("/payment-gateways", { params })
  return res.data
}

export const getActivePaymentGateways = async () => {
  const res = await api.get("/payment-gateways/active")
  return res.data
}

export const createPaymentGateway = async (data: any) => {
  const payload = {
    name: data.name,
    description: data.description,
    commission_percentage: Number(data.commission_percentage),
    api_key: data.api_key,
    merchant_id: data.merchant_id,
    active: !!data.active,
    ...(data.configuration && { configuration: data.configuration }),
  }
  const res = await api.post("/payment-gateways", payload)
  return res.data
}

export const updatePaymentGateway = async (id: string | number, data: any) => {
  const res = await api.put(`/payment-gateways/${id}`, data)
  return res.data
}

export const deletePaymentGateway = async (id: string | number) => {
  const res = await api.delete(`/payment-gateways/${id}`)
  return res.data
}

export const togglePaymentGatewayStatus = async (id: string | number) => {
  const res = await api.patch(`/payment-gateways/${id}/toggle-status`)
  return res.data
}

/* =========================
   Categorías de Excepciones
========================= */

export const getExceptionCategories = async (params?: any) => {
  const res = await api.get("/payment-exception-categories", { params })
  return res.data
}

export const createExceptionCategory = async (data: any) => {
  const payload = {
    name: data.name,
    description: data.description,
    due_day_override: data.due_day_override,
    skip_late_fee: !!data.skip_late_fee,
    allow_partial_payments: !!data.allow_partial_payments,
    skip_blocking: !!data.skip_blocking,
    active: !!data.active,
    ...(data.additional_rules && { additional_rules: data.additional_rules }),
  }
  const res = await api.post("/payment-exception-categories", payload)
  return res.data
}

export const updateExceptionCategory = async (id: string | number, data: any) => {
  const res = await api.put(`/payment-exception-categories/${id}`, data)
  return res.data
}

export const deleteExceptionCategory = async (id: string | number) => {
  const res = await api.delete(`/payment-exception-categories/${id}`)
  return res.data
}

export const toggleExceptionCategoryStatus = async (id: string | number) => {
  const res = await api.patch(`/payment-exception-categories/${id}/toggle-status`)
  return res.data
}

export const assignCategoryToStudent = async (categoryId: string | number, data: any) => {
  const res = await api.post(`/payment-exception-categories/${categoryId}/assign-student`, data)
  return res.data
}

export const assignCategoryBulk = async (categoryId: string | number, data: {
  prospectos: number[]
  effective_from?: string | null
  effective_until?: string | null
  notes?: string | null
}) => {
  const res = await api.post(`/payment-exception-categories/${categoryId}/assign-bulk`, data)
  return res.data
}

export const assignCategoryToProspecto = async (categoryId: string | number, data: {
  prospecto_id: number
  effective_from?: string | null
  effective_until?: string | null
  notes?: string | null
}) => {
  const res = await api.post(`/payment-exception-categories/${categoryId}/assign-prospecto`, data)
  return res.data
}

export const removeCategoryFromProspecto = async (categoryId: string | number, prospectoId: number) => {
  const res = await api.delete(`/payment-exception-categories/${categoryId}/remove-prospecto`, {
    data: { prospecto_id: prospectoId }
  })
  return res.data
}

export const getAssignedProspectos = async (categoryId: string | number) => {
  const res = await api.get(`/payment-exception-categories/${categoryId}/assigned-prospectos`)
  return res.data
}

/* =========================
   Gestión de Cobros / Colecciones
========================= */

export const getCollectionLogs = async (params?: any) => {
  const res = await api.get("/collection-logs", { params })
  return res.data
}

export const createCollectionLog = async (data: any) => {
  const res = await api.post("/collection-logs", data)
  return res.data
}

export const updateCollectionLog = async (id: string | number, data: any) => {
  const res = await api.put(`/collection-logs/${id}`, data)
  return res.data
}

export const deleteCollectionLog = async (id: string | number) => {
  const res = await api.delete(`/collection-logs/${id}`)
  return res.data
}

export const fetchCollectionData = async (params?: any) => {
  const res = await api.get("/collections/late-payments", { params })
  return res.data
}

/** Late payments (colecciones) */
export const fetchLatePayments = async (
  params: LatePaymentsQuery = {},
): Promise<LatePaymentsResponseType> => {
  const res = await api.get("/collections/late-payments", { params })
  // backend puede devolver {data, meta, summary} o un array; normalizamos:
  const data = Array.isArray(res.data) ? res.data : res.data?.data
  const meta: PaginationMeta = res.data?.meta ?? {
    total: Array.isArray(data) ? data.length : 0,
    per_page: params.per_page ?? (Array.isArray(data) ? data.length : 0),
    current_page: params.page ?? 1,
    last_page: 1,
  }
  const summary = res.data?.summary ?? {
    total_cuotas: 0,
    total_deuda_original: 0,
    total_mora: 0,
    total_con_mora: 0,
    estudiantes_unicos: 0,
  }
  return { data: data ?? [], meta, summary, request_id: res.data?.request_id ?? '' }
}

/** Snapshot de estudiante (por EP id) */
export const fetchStudentSnapshot = async (epId: number | string): Promise<StudentSnapshot> => {
  const res = await api.get(`/collections/students/${epId}/snapshot`)
  return res.data as StudentSnapshot
}

/** Cuotas pendientes con vencimiento en los próximos 30 días */
export const fetchUpcomingPayments = async (params: {
  q?: string
  programa_id?: number | string
} = {}) => {
  const res = await api.get("/collections/upcoming-payments", { params })
  const data = Array.isArray(res.data?.data) ? res.data.data : (res.data ?? [])
  return { data, meta: res.data?.meta ?? { total: data.length } }
}

/* =========================
   Kardex / Cuotas por Prospecto/Programa
========================= */

export const getKardexPagos = async (params?: any) => {
  const res = await api.get("/kardex-pagos", { params })
  return res.data
}

export const createKardexPago = async (data: any) => {
  const res = await api.post("/kardex-pagos", data)
  return res.data
}

export const getCuotasByProspecto = async (
  prospectoId: string | number,
  params?: any,
) => {
  const res = await api.get(`/prospectos/${prospectoId}/cuotas`, { params })
  return res.data
}

export const getCuotasByPrograma = async (
  programaId: string | number,
  params?: any,
) => {
  const res = await api.get(`/estudiante-programa/${programaId}/cuotas`, { params })
  return res.data
}

/* =========================
   Prospectos / Emails
========================= */

export async function getProspectos(params?: { per_page?: number; page?: number; q?: string }) {
  const res = await api.get("/prospectos", { params })
  return {
    data: Array.isArray(res.data) ? res.data : res.data?.data ?? [],
    meta: res.data?.meta
  }
}

export async function getProspectoById(id: number) {
  const res = await api.get(`/prospectos/${id}`)
  // backend responde { message, data }
  return res.data?.data
}

export async function sendEmailToProspect(payload: {
  to: string; subject: string; html: string; attachments?: File[];
}) {
  const form = new FormData()
  form.append("to", payload.to)
  form.append("subject", payload.subject)
  form.append("html", payload.html)
  for (const f of payload.attachments ?? []) {
    form.append("attachments[]", f)
  }
  const res = await api.post("/emails/send", form, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data
}



export const getKardexPendientes = async (params: {
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  banco?: string;
  programa_id?: number;
  page?: number; // 🚀 Paginación del servidor
  per_page?: number; // 🚀 Paginación del servidor
  search?: string; // 🔎 Búsqueda alumno/carnet/recibo
  search_alumno?: string;
  search_carnet?: string;
  search_referencia?: string;
} = {}) => {
  const res = await api.get("/conciliacion/pendientes-desde-kardex", { params })
  return res.data
}

export const previewConciliacion = async (rows: any[]) => {
  const res = await api.post("/conciliacion/preview", { rows })
  return res.data
}

export const confirmConciliacion = async (payload: {
  index: number; carnet: string; banco: string; recibo: string; monto: number; fechaPago?: string;
}) => {
  const res = await api.post("/conciliacion/confirm", payload)
  return res.data
}

export const rejectConciliacion = async (payload: {
  index: number; motivo: string;
}) => {
  const res = await api.post("/conciliacion/reject", payload)
  return res.data
}



export const importConciliacion = async (file: File) => {
  const form = new FormData()
  form.append("file", file)
  const res = await api.post("/conciliacion/import", form, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data // { ok, message, summary: { created, updated, skipped, errors } }
}

export const downloadConciliacionTemplate = async () => {
  const res = await api.get("/conciliacion/template", { responseType: "blob" })
  return res.data as Blob
}

export const exportConciliacionXlsx = async (params: {
  from?: string; to?: string; bank?: string; status?: string; programa_id?: number;
}) => {
  const res = await api.get("/conciliacion/export", { params, responseType: "blob" })
  return res.data as Blob
}

// Exportar conciliados en diferentes formatos
export const exportConciliados = async (
  format: 'excel' | 'pdf' | 'csv',
  params: {
    from?: string;
    to?: string;
    banco?: string;
    programa_id?: number;
  }
) => {
  const res = await api.get("/conciliacion/export-conciliados", {
    params: { ...params, format },
    responseType: "blob"
  })
  return res.data as Blob
}

// Exportar pendientes en formato compatible con importación bancaria
// Columnas: Banco, Referencia, Monto, Fecha
export const exportPendientesParaImportacion = async (
  format: 'excel' | 'csv' = 'excel',
  params: {
    from?: string;
    to?: string;
    banco?: string;
    programa_id?: number;
  } = {}
) => {
  const res = await api.get("/conciliacion/export-pendientes-importacion", {
    params: { ...params, format },
    responseType: "blob"
  })
  return res.data as Blob
}

// Obtener filtros disponibles (bancos y programas)
export const getFiltrosDisponibles = async () => {
  const res = await api.get("/conciliacion/filtros-disponibles")
  return res.data
}

// services/finance.ts
export const getKardexConciliados = async (params: {
  from?: string; 
  to?: string; 
  banco?: string;
  programa_id?: number;
  page?: number; // 🚀 Paginación del servidor
  per_page?: number; // 🚀 Paginación del servidor
  search?: string; // 🔎 Búsqueda alumno/carnet/recibo
  search_alumno?: string;
  search_carnet?: string;
  search_referencia?: string;
} = {}) => {
  const res = await api.get("/conciliacion/conciliados-desde-kardex", { params })
  return res.data
}

/* =========================
   Prospectos + Moodle (Mailing Combinado)
========================= */

export interface ProspectoCombinado {
  id: number | string // number para prospectos, string "moodle_XXX" para Moodle sin prospecto
  nombre_completo: string
  carnet: string
  correo_electronico?: string
  telefono?: string
  correo_corporativo?: string
  telefono_corporativo?: string
  status: string
  ciudad?: string
  origen: "prospecto_con_moodle" | "moodle_sin_prospecto"
  tiene_prospecto: boolean
  prospecto_id?: number | null
  moodle_activo: boolean
  total_matriculaciones?: number
  created_at?: string | null
}

export interface MailingCombinedResponse {
  success: boolean
  data: ProspectoCombinado[]
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    mes_filtrado: number
    anio_filtrado: number
  }
  summary: {
    total_prospectos_con_moodle: number
    total_moodle_sin_prospecto: number
    total_combinado: number
  }
}

/**
 * 🆕 Obtener prospectos combinados con estudiantes de Moodle
 * 
 * Retorna prospectos activos en Moodle + estudiantes de Moodle sin prospecto
 */
export const getProspectosMoodleCombined = async (params?: {
  mes?: number
  anio?: number
  filter?: "all" | "with_prospecto" | "without_prospecto"
  per_page?: number
  page?: number
  all?: boolean
  search?: string
  incluirMoodle?: boolean
  incluirCRM?: boolean
}): Promise<MailingCombinedResponse> => {
  // ✅ Si all=true o per_page >= 10000, forzar all=true
  const finalParams = { ...params }
  if (params?.all || (params?.per_page && params.per_page >= 10000)) {
    finalParams.all = true
    finalParams.per_page = undefined // No enviar per_page cuando all=true
  }
  
  // 🔥 Corregido: usar la ruta correcta /prospectos/mailing-combined (no /administracion/prospectos/...)
  const res = await api.get("/prospectos/mailing-combined", { params: finalParams })
  return res.data
}

/**
 * ✅ NUEVO: Obtener solo prospectos internos del CRM (sin Moodle)
 * 
 * Útil cuando se necesita solo datos del CRM sin combinación con Moodle
 */
export const getProspectosInternos = async (params?: {
  search?: string
  per_page?: number
  page?: number
  all?: boolean
}): Promise<MailingCombinedResponse> => {
  // ✅ Si all=true o per_page >= 10000, forzar all=true
  const finalParams = { ...params }
  if (params?.all || (params?.per_page && params.per_page >= 10000)) {
    finalParams.all = true
    finalParams.per_page = undefined // No enviar per_page cuando all=true
  }
  
  const res = await api.get("/prospectos/mailing-internos", { params: finalParams })
  return res.data
}

/**
 * 🌐 NUEVO: Obtener UNIVERSO COMPLETO de estudiantes
 * Incluye TODOS los estudiantes de Moodle + CRM interno
 * Con información de programas, cuotas, estado financiero
 */
export const getUniversoEstudiantes = async (params?: {
  page?: number
  per_page?: number
  search?: string
  programa_moodle?: string // 🆕 Filtro por programa de Moodle (city)
  programa_crm_id?: number // 🆕 Filtro por programa del CRM
  estado_financiero?: string // MOROSO, AL_DIA, SIN_PROGRAMA, NO_EN_CRM
  suspended?: string // 0=Activo, 1=Suspendido
  status_personalizado?: string // Activo, Graduado, Inactivo, Suspendido, SIN_ESTADO
  mes?: number
  anio?: number
}) => {
  const res = await api.get("/dashboard-financiero/universo-estudiantes", { params })
  return res.data
}

/**
 * 🆕 NUEVO: Obtener programas disponibles para filtros del Universo
 */
export const getUniversoProgramas = async () => {
  const res = await api.get("/dashboard-financiero/universo-programas")
  return res.data
}

/**
 * 🆕 NUEVO: Obtener estadísticas GLOBALES del universo de estudiantes
 * Retorna: total, morosos, al_dia, estudiantes_por_programa
 */
export const getUniversoEstadisticas = async (params?: {
  mes?: number
  anio?: number
}) => {
  const res = await api.get("/dashboard-financiero/universo-estadisticas", { params })
  return res.data
}

