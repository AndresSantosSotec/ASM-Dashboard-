import api from './api'

export type ProspectoRow = {
  id: number
  carnet?: string
  nombre: string
  programas: Array<{ id: number; programa?: string }>
  cuotas_pagadas: number
  cuotas_pendientes: number
  monto_total: number
  monto_pagado: number
  balance: number
  bloqueado: boolean
  ultimo_pago?: string | null
}

export async function fetchProspectos(params: {
  q?: string
  program_id?: string | number
  status?: 'al_dia' | 'bloqueado'
  page?: number
  per_page?: number
}) {
  const res = await api.get('/admin/prospectos', { params })
  return res.data as { data: ProspectoRow[]; meta: any }
}

export type AccountData = {
  student: { id: number; name: string; carnet?: string }
  balance: {
    isBlocked: boolean
    warningLevel: 0|1|2
    nextDueDate?: string | null
    daysUntilDue?: number | null
    latePayments: number
    totalMora?: number
    totalPendiente?: number
    totalConMora?: number
  }
  pendingPayments: Array<{
    id: number
    concept: string
    amount: number
    lateFee: number
    dueDate: string
    status: 'pendiente'|'vencido'
    daysLate?: number | null
  }>
  paymentHistory: Array<{
    id: number
    concept: string
    amount: number
    paymentDate: string
    method: string
    reference: string
  }>
}

export async function fetchEstadoCuenta(prospectoId: number) {
  const res = await api.get(`/admin/prospectos/${prospectoId}/estado-cuenta`)
  return res.data as AccountData
}
