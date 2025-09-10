import api from './api'

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

type LatePaymentsParams = {
  q?: string
  bucket?: 'all'|'b1'|'b2'|'b3'|'b4'
  programa_id?: number | string
  page?: number
  per_page?: number
}

export type LatePaymentRow = {
  id: number              // EP id (row id)
  studentId: number
  name: string
  program: string
  totalDebt: number
  lateMonths: number
  daysLate: number
  bucket: 'B1'|'B2'|'B3'|'B4'
  status: 'activo'|'bloqueado'
  lastContact?: string | null
  promiseDate?: string | null
}

export const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  const res = await api.get('/reports/summary')
  return Array.isArray(res.data) ? res.data[0] : res.data
}

export const getInvoices = async (params?: any) => {
  const res = await api.get('/invoices', { params })
  return res.data
}

export const createInvoice = async (data: any) => {
  const res = await api.post('/invoices', data)
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

export const fetchRecentPayments = async (limit = 5) => {
  const res = await api.get('/payments', { params: { per_page: limit } })
  const data = Array.isArray(res.data) ? res.data : res.data.data
  return Array.isArray(data) ? data.slice(0, limit) : []
}

export const createPayment = async (data: any) => {
  const res = await api.post('/payments', data)
  return res.data
}

export const getPaymentRules = async () => {
  const res = await api.get('/payment-rules')
  return res.data
}

export const getCurrentPaymentRule = async () => {
  const res = await api.get('/payment-rules-current')
  return res.data
}

export const getPaymentRuleById = async (id: string | number) => {
  const res = await api.get(`/payment-rules/${id}`)
  return res.data
}

export const updatePaymentRules = async (id: string | number, data: any) => {
  const res = await api.put(`/payment-rules/${id}`, data)
  return res.data
}

export const createNotificationRule = async (ruleId: string | number, data: any) => {
  const payload = {
    type: data.type ?? "email",
    offset_days: Number(data.triggerDays ?? 0),
    message: data.message ?? "",
  }
  const res = await api.post(`/payment-rules/${ruleId}/notifications`, payload)
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

  const res = await api.put(
    `/payment-rules/${ruleId}/notifications/${notificationId}`,
    payload,
  )
  return res.data
}

export const deleteNotificationRule = async (
  ruleId: string | number,
  notificationId: string | number,
) => {
  const res = await api.delete(
    `/payment-rules/${ruleId}/notifications/${notificationId}`,
  )
  return res.data
}

export const getCollectionLogs = async (params?: any) => {
  const res = await api.get('/collection-logs', { params })
  return res.data
}

export const createCollectionLog = async (data: any) => {
  const res = await api.post('/collection-logs', data)
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

export const exportFinancialReport = async (
  format: 'pdf' | 'excel',
  queue?: boolean,
) => {
  const res = await api.get('/reports/export', {
    params: { format, ...(queue ? { queue: 1 } : {}) },
    responseType: queue ? 'json' : 'blob',
  })
  return res.data
}

export const getKardexPagos = async (params?: any) => {
  const res = await api.get('/kardex-pagos', { params })
  return res.data
}

export const createKardexPago = async (data: any) => {
  const res = await api.post('/kardex-pagos', data)
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

export const fetchCollectionData = async (params?: any) => {
  const res = await api.get('/finance/collections', { params })
  return res.data
}

export const fetchStudentAccountSummary = async (
  studentId?: string | number,
) => {
  const url = studentId
    ? `/students/${studentId}/account-summary`
    : '/students/account-summary'
  const res = await api.get(url)
  return res.data
}

export const fetchFinancialReports = async (params?: any) => {
  const res = await api.get('/financial-reports', { params })
  return res.data
}

export const createPaymentRule = async (data: any) => {
  const res = await api.post('/payment-rules', data)
  return res.data
}

export const fetchNotificationRulesByRule = async (ruleId: string | number) => {
  const res = await api.get(`/payment-rules/${ruleId}/notifications`)
  const list = Array.isArray(res.data) ? res.data : res.data?.data
  return Array.isArray(list) ? list : []
}

// --- BLOQUEOS DE SERVICIO (Blocking Rules) ---
export const fetchBlockingRulesByRule = async (ruleId: string | number) => {
  try {
    const res = await api.get(`/payment-rules/${ruleId}/blocking-rules`)
    const list = Array.isArray(res.data) ? res.data : res.data?.data
    return Array.isArray(list) ? list : []
  } catch (error: any) {
    console.error('Error fetching blocking rules:', error)
    throw error
  }
}

export const createBlockingRule = async (ruleId: string | number, data: any) => {
  const payload = {
    name: data.name?.trim(),
    description: data.description,
    days_after_due: Number(data.daysAfterDue),
    affected_services: Array.isArray(data.services) ? data.services : [],
    active: !!data.active,
  }

  const res = await api.post(`/payment-rules/${ruleId}/blocking-rules`, payload)
  return res.data
}

export const updateBlockingRule = async (
  ruleId: string | number,
  blockingRuleId: string | number,
  data: any
) => {
  const payload: any = {}
  if (data.name !== undefined) payload.name = data.name
  if (data.description !== undefined) payload.description = data.description
  if (data.daysAfterDue !== undefined) payload.days_after_due = Number(data.daysAfterDue)
  if (data.services !== undefined) payload.affected_services = data.services
  if (data.active !== undefined) payload.active = !!data.active

  const res = await api.put(
    `/payment-rules/${ruleId}/blocking-rules/${blockingRuleId}`,
    payload
  )
  return res.data
}

export const deleteBlockingRule = async (
  ruleId: string | number,
  blockingRuleId: string | number,
) => {
  const res = await api.delete(
    `/payment-rules/${ruleId}/blocking-rules/${blockingRuleId}`
  )
  return res.data
}

// --- COLLECTIONS MODULE (Payment Management) ---
import type { 
  LatePaymentsResponse, 
  StudentSnapshot,
} from '@/types/collections'

export async function fetchLatePayments(params?: {
  q?: string
  bucket?: 'all' | 'b1' | 'b2' | 'b3' | 'b4'
  programa_id?: number | string
  per_page?: number
  page?: number
}): Promise<LatePaymentsResponse> {
  const res = await api.get('/collections/late-payments', { params })
  return res.data as LatePaymentsResponse
}

export async function fetchStudentSnapshot(epId: number | string): Promise<StudentSnapshot> {
  const res = await api.get(`/collections/students/${epId}/snapshot`)
  return res.data as StudentSnapshot
}

// Lista paginada de pagos con filtros
export async function getPayments(params: {
  status?: 'aprobado' | 'pendiente' | 'rechazado'
  method?: string
  program_id?: number | string
  q?: string
  fecha_inicio?: string
  fecha_fin?: string
  page?: number
  per_page?: number
  sort?: string
} = {}) {
  const res = await api.get('/payments', { params })
  const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
  const meta = res.data?.meta ?? {
    total: data.length,
    per_page: params.per_page ?? data.length,
    current_page: params.page ?? 1,
    last_page: 1,
  }
  return { data, meta }
}

// Prospecto: ficha técnica
export async function getProspectoById(id: number) {
  const res = await api.get(`/prospectos/${id}`)
  return res.data
}

// Endpoint para enviar correo
export async function sendEmailToProspect(payload: {
  to: string
  subject: string
  html: string
}) {
  const res = await api.post('/emails/send', payload)
  return res.data
}

// Dashboard Financiero
import type { DashboardFinancieroData } from '@/types/dashboard'

type DashboardFinancieroParams = {
  fecha_inicio: string
  fecha_fin: string
  limit_pagos?: number
  limit_alertas?: number
}

export async function fetchDashboardFinanciero(params: DashboardFinancieroParams): Promise<DashboardFinancieroData> {
  const { fecha_inicio, fecha_fin, limit_pagos = 10, limit_alertas = 20 } = params
  const res = await api.get('/dashboard-financiero', {
    params: { fecha_inicio, fecha_fin, limit_pagos, limit_alertas },
  })
  return res.data as DashboardFinancieroData
}