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

export const getCurrentPaymentRule = async () => {
  // Devuelve la última regla creada (o 404 si no hay)
  // El backend puede incluir notifications si usas ->load('notifications')
  const res = await api.get('/payment-rules-current')
  return res.data
}

export const getPaymentRuleById = async (id: string | number) => {
  const res = await api.get(`/payment-rules/${id}`)
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
  // map UI -> API
const payload = {
  type: data.type ?? "email", // o el valor por defecto
  offset_days: Number(data.triggerDays ?? 0),
  message: data.message ?? "",
};
  const res = await api.post(`/payment-rules/${ruleId}/notifications`, payload)
  return res.data
}

export const updateNotificationRule = async (
  ruleId: string | number,
  notificationId: string | number,
  data: any,
) => {
  // map UI -> API (usar 'sometimes' del backend)
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

export const createPaymentRule = async (data: any) => {
  const res = await api.post('/payment-rules', data)
  return res.data
}

export const fetchNotificationRulesByRule = async (ruleId: string | number) => {
  const res = await api.get(`/payment-rules/${ruleId}/notifications`)
  // backend responde { data: [...] }
  const list = Array.isArray(res.data) ? res.data : res.data?.data
  return Array.isArray(list) ? list : []
}

// --- BLOQUEOS DE SERVICIO (Blocking Rules) ---

export const fetchBlockingRulesByRule = async (ruleId: string | number) => {
  try {
    const res = await api.get(`/payment-rules/${ruleId}/blocking-rules`)
    
    // backend responde { data: [...] } o directamente array
    const list = Array.isArray(res.data) ? res.data : res.data?.data
    return Array.isArray(list) ? list : []
  } catch (error: any) {
    throw error
  }
}

export const createBlockingRule = async (ruleId: string | number, data: any) => {
  // Validación del ruleId
  if (!ruleId || isNaN(Number(ruleId))) {
    throw new Error('ID de regla de pago inválido')
  }

  const payload = {
    name: data.name?.trim(),
    description: data.description,
    days_after_due: Number(data.daysAfterDue),
    affected_services: Array.isArray(data.services) ? data.services : [],
    active: !!data.active,
  }

  // Validaciones frontend
  if (!payload.name) {
    throw new Error('El nombre es requerido')
  }
  
  if (isNaN(payload.days_after_due) || payload.days_after_due <= 0) {
    throw new Error('Los días después del vencimiento deben ser mayores a cero')
  }
  
  if (payload.affected_services.length === 0) {
    throw new Error('Debe seleccionar al menos un servicio')
  }

  // Validar servicios válidos
  const validServices = ['plataforma', 'evaluaciones', 'materiales']
  const invalidServices = payload.affected_services.filter((s: string) => !validServices.includes(s))
  if (invalidServices.length > 0) {
    throw new Error(`Servicios inválidos: ${invalidServices.join(', ')}`)
  }

  const url = `/payment-rules/${ruleId}/blocking-rules`

  try {
    const res = await api.post(url, payload)
    return res.data
  } catch (error: any) {
    throw error
  }
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

  try {
    const res = await api.put(
      `/payment-rules/${ruleId}/blocking-rules/${blockingRuleId}`,
      payload
    )
    return res.data
  } catch (error: any) {
    throw error
  }
}

export const deleteBlockingRule = async (
  ruleId: string | number,
  blockingRuleId: string | number,
) => {
  try {
    const res = await api.delete(
      `/payment-rules/${ruleId}/blocking-rules/${blockingRuleId}`
    )
    return res.data
  } catch (error: any) {
    throw error
  }
}

// --- PAYMENT GATEWAYS ---
export const getPaymentGateways = async (params?: any) => {
  const res = await api.get('/payment-gateways', { params })
  return res.data
}

// --- PAYMENT GATEWAYS --- ✅ CORREGIDO
export const createPaymentGateway = async (data: any) => {
  const payload = {
    name: data.name,
    description: data.description,
    commission_percentage: Number(data.commission_percentage),
    api_key: data.api_key,
    merchant_id: data.merchant_id,
    active: !!data.active,
    // ✅ CAMBIO: Enviar objeto vacío o omitir campo
    ...(data.configuration && { configuration: data.configuration })
  }
  
  const res = await api.post('/payment-gateways', payload)
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

export const getActivePaymentGateways = async () => {
  const res = await api.get('/payment-gateways/active')
  return res.data
}

// --- EXCEPTION CATEGORIES ---
export const getExceptionCategories = async (params?: any) => {
  const res = await api.get('/payment-exception-categories', { params })
  return res.data
}

// --- EXCEPTION CATEGORIES --- ✅ CORREGIDO
export const createExceptionCategory = async (data: any) => {
  const payload = {
    name: data.name,
    description: data.description,
    due_day_override: data.due_day_override,
    skip_late_fee: !!data.skip_late_fee,
    allow_partial_payments: !!data.allow_partial_payments,
    skip_blocking: !!data.skip_blocking,
    active: !!data.active,
    // ✅ CAMBIO: Enviar objeto vacío o omitir campo  
    ...(data.additional_rules && { additional_rules: data.additional_rules })
  }
  
  const res = await api.post('/payment-exception-categories', payload)
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

//
export const fetchDashboardFinanciero = async (params?: any) => {
  const res = await api.get('/dashboard-financiero', { params })
  return res.data
}
