export interface LatePaymentStudent {
  id: number
  studentId: number
  prospectoId?: number // ← opcional
  name: string
  program: string
  totalDebt: number
  lateMonths: number
  daysLate: number
  bucket: string
  status: string
  lastContact: string | null
  promiseDate: string | null
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
    total_students: number
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