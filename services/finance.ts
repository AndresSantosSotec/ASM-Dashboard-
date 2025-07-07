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

export const getPayments = async (params?: any) => {
  const res = await api.get('/payments', { params })
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

export const updatePaymentRules = async (
  id: string | number,
  data: any,
) => {
  const res = await api.put(`/payment-rules/${id}`, data)
  return res.data
}

export const createNotificationRule = async (
  ruleId: string | number,
  data: any,
) => {
  const res = await api.post(`/payment-rules/${ruleId}/notifications`, data)
  return res.data
}

export const updateNotificationRule = async (
  ruleId: string | number,
  notificationId: string | number,
  data: any,
) => {
  const res = await api.put(
    `/payment-rules/${ruleId}/notifications/${notificationId}`,
    data,
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

export const getPendingReconciliation = async () => {
  const res = await api.get('/reconciliation/pending')
  return res.data
}

export const uploadReconciliation = async (data: FormData) => {
  const res = await api.post('/reconciliation/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const processReconciliation = async () => {
  const res = await api.post('/reconciliation/process')
  return res.data
}

export const getPaymentPlans = async (params?: any) => {
  const res = await api.get('/payment-plans', { params })
  return res.data
}

export const createPaymentPlan = async (data: any) => {
  const res = await api.post('/payment-plans', data)
  return res.data
}

export const updatePaymentPlan = async (id: string | number, data: any) => {
  const res = await api.put(`/payment-plans/${id}`, data)
  return res.data
}

export const deletePaymentPlan = async (id: string | number) => {
  const res = await api.delete(`/payment-plans/${id}`)
  return res.data
}

export const getInstallments = async (planId: string | number) => {
  const res = await api.get(`/payment-plans/${planId}/installments`)
  return res.data
}

export const createInstallment = async (
  planId: string | number,
  data: any,
) => {
  const res = await api.post(`/payment-plans/${planId}/installments`, data)
  return res.data
}

export const updateInstallment = async (
  installmentId: string | number,
  data: any,
) => {
  const res = await api.put(`/payment-plans/installments/${installmentId}`, data)
  return res.data
}

export const deleteInstallment = async (installmentId: string | number) => {
  const res = await api.delete(
    `/payment-plans/installments/${installmentId}`,
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
  const res = await api.get(`/prospectos/${prospectoId}/cuotas`, {
    params,
  })
  return res.data
}

export const getCuotasByPrograma = async (
  programaId: string | number,
  params?: any,
) => {
  const res = await api.get(`/estudiante-programa/${programaId}/cuotas`, {
    params,
  })
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


