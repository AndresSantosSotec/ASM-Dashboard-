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
  excepciones?: {
    skip_late_fee: boolean
    skip_blocking: boolean
    allows_partial_payments: boolean
    due_day_override: number | null
    categories: Array<{
      id: number
      name: string
      description: string
      due_day_override: number | null
      skip_late_fee: boolean
      allow_partial_payments: boolean
      skip_blocking: boolean
      effective_from?: string | null
      effective_until?: string | null
      notes?: string | null
    }>
  } // ✅ Información de excepciones activas
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
  student: { 
    id: number
    name: string
    carnet?: string
    email?: string  // 🔥 NUEVO: Email del estudiante
    telefono?: string | null  // 🔥 NUEVO: Teléfono
    moneda?: "GTQ" | "USD"  // 💱 Moneda del estudiante (GTQ por defecto). Tasa fija 8 GTQ/USD.
  }
  programas?: Array<{  // 🔥 NUEVO: Lista de programas
    id: number
    nombre?: string
    abreviatura?: string
  }>
  balance: {
    isBlocked: boolean
    warningLevel: 0|1|2
    nextDueDate?: string | null
    daysUntilDue?: number | null
    latePayments: number
    totalMora?: number  // 🔥 Mora única Q50
    totalPendiente?: number  // 🔥 Total sin mora
    totalConMora?: number  // 🔥 Total con mora única
  }
  pendingPayments: Array<{
    id: number
    concept: string
    numero_cuota?: number  // 🔥 NUEVO
    amount: number
    lateFee: number
    dueDate: string
    status: 'pendiente'|'vencido'
    daysLate?: number | null
    mes_pago?: string  // 🔥 NUEVO
    anio_pago?: string  // 🔥 NUEVO
    es_especial?: boolean  // 🔥 NUEVO: Indica pago especial (inscripción, matrícula)
    programa_id?: number  // 🔥 NUEVO
    programa_nombre?: string  // 🔥 NUEVO
  }>
  paymentHistory: Array<{
    id: number
    concept: string
    numero_cuota?: number  // 🔥 NUEVO
    amount: number
    paymentDate: string
    method: string
    reference: string
    banco?: string  // 🔥 NUEVO
    mes_pago?: string  // 🔥 NUEVO
    anio_pago?: string  // 🔥 NUEVO
    es_especial?: boolean  // 🔥 NUEVO: Indica pago especial
    programa_id?: number  // 🔥 NUEVO
    programa_nombre?: string  // 🔥 NUEVO
  }>
  excepciones?: {
    skip_late_fee: boolean
    skip_blocking: boolean
    allows_partial_payments: boolean
    due_day_override: number | null
    categories: Array<{
      id: number
      name: string
      description: string
      due_day_override: number | null
      skip_late_fee: boolean
      allow_partial_payments: boolean
      skip_blocking: boolean
      effective_from?: string | null
      effective_until?: string | null
      notes?: string | null
    }>
  }
}

export async function fetchEstadoCuenta(prospectoId: number) {
  const res = await api.get(`/admin/prospectos/${prospectoId}/estado-cuenta`)
  return res.data as AccountData
}
