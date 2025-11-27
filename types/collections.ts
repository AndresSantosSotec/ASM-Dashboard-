export interface LatePaymentStudent {
  id: number // ID de la cuota
  cuotaId: number
  numeroCuota?: number | null
  epId: number
  studentId: number
  name: string
  program: string
  montoCuota: number // Monto de esta cuota específica
  lateFee: number // Mora de esta cuota (siempre 0, la mora se aplica por estudiante)
  totalConMora: number // Monto de esta cuota (sin mora individual)
  fechaVencimiento: string
  daysLate: number
  lateMonths: number
  bucket: string
  carnet?: string
  activoEnMoodle?: boolean
  calificaParaMora?: boolean // Si esta cuota califica para mora (calculado en backend)
  estudianteTieneMora?: boolean // Si este estudiante tiene mora aplicada (Q50 único)
  cursosDelMes?: Array<{
    id: number
    nombre: string
    shortname: string
    estado: string
  }> // 🆕 Lista de cursos del mes actual en Moodle
  cantidadCursos?: number // 🆕 Cantidad de cursos matriculados este mes
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


export interface LatePaymentsResponse {
  data: LatePaymentStudent[]
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
  summary: {
    total_cuotas: number
    total_deuda_original: number
    total_mora: number
    total_con_mora: number
    estudiantes_unicos: number
  }
  request_id: string
}

export interface PendingInstallment {
  id: number
  concepto: string
  monto: number
  fecha_vencimiento: string
  days_late: number
}

export interface RecentPayment {
  id: number
  fecha_pago: string
  monto_pagado: number
  metodo_pago: string
  numero_boleta?: string
  banco?: string
  estado_pago: string
}

export interface StudentSnapshot {
  prospecto_id: any
  ep: {
    id: number
    prospecto: {
      id: number
      nombre_completo: string
      carnet: string
    }
    programa: {
      id: number
      nombre_del_programa: string
    }
  }
  pending_installments: PendingInstallment[]
  recent_payments: RecentPayment[]
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

export interface PaymentPlanInstallment {
  number: number
  amount: number
  dueDate: string
  status: string
}

export interface PaymentPlanPreview {
  id: null | string
  epId: number
  student: string
  program: string
  originalDebt: number
  lateFeeTotal: number
  total: number
  months: number
  startDate: string
  dueDay: number
  installmentAmount: number
  installments: PaymentPlanInstallment[]
  notes: string
}

export interface PaymentPlanPreviewResponse {
  plan: PaymentPlanPreview
  request_id?: string
}

export interface PaymentPlanOverview {
  id: number | string
  studentId: number
  studentName: string
  originalDebt: number
  currentDebt: number
  installments: PaymentPlanInstallment[]
  startDate: string
  endDate: string
  status: string
  notes: string
  createdBy: string
}

export interface PaymentPlansOverviewResponse {
  data: PaymentPlanOverview[]
  meta: {
    total: number
  }
}

export interface PaymentPlanCreateRequest {
  ep_id: number | string
  months?: number
  start_date?: string
  include_late_fees?: boolean
}

export interface PaymentPlanPreviewRequest {
  ep_id: number | string
  months?: number
  start_date?: string
  include_late_fees?: boolean
}