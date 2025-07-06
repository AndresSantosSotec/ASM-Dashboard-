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

export const createPayment = async (data: any) => {
  const res = await api.post('/payments', data)
  return res.data
}

export const getPaymentRules = async () => {
  const res = await api.get('/payment-rules')
  return res.data
}

export const updatePaymentRules = async (data: any) => {
  const res = await api.put('/payment-rules', data)
  return res.data
}

export const getReconciliation = async (params?: any) => {
  const res = await api.get('/reconciliation', { params })
  return res.data
}

export const uploadReconciliation = async (data: FormData) => {
  const res = await api.post('/reconciliation/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const reconcileReceipts = async (ids: string[]) => {
  const res = await api.post('/reconciliation', { ids })
  return res.data
}

