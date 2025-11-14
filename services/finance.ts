// services/finance.ts
import api from "./api"

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
  const res = await api.get("/finance/collections", { params })
  return res.data
}

/** Late payments (colecciones) */
export const fetchLatePayments = async (
  params: LatePaymentsQuery = {},
): Promise<LatePaymentsResponse> => {
  const res = await api.get("/collections/late-payments", { params })
  // backend puede devolver {data, meta} o un array; normalizamos:
  const data = Array.isArray(res.data) ? res.data : res.data?.data
  const meta: PaginationMeta = res.data?.meta ?? {
    total: Array.isArray(data) ? data.length : 0,
    per_page: params.per_page ?? (Array.isArray(data) ? data.length : 0),
    current_page: params.page ?? 1,
    last_page: 1,
  }
  return { data: data ?? [], meta }
}

/** Snapshot de estudiante (por EP id) */
export const fetchStudentSnapshot = async (epId: number | string): Promise<StudentSnapshot> => {
  const res = await api.get(`/collections/students/${epId}/snapshot`)
  return res.data as StudentSnapshot
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
  from?: string; to?: string; bank?: string; status?: string
}) => {
  const res = await api.get("/conciliacion/export", { params, responseType: "blob" })
  return res.data as Blob
}

// services/finance.ts
export const getKardexConciliados = async (params: {
  from?: string; to?: string; banco?: string;
} = {}) => {
  const res = await api.get("/conciliacion/conciliados-desde-kardex", { params })
  return res.data
}