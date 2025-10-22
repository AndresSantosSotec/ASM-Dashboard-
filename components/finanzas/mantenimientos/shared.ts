export type KardexStatus = "aplicado" | "pendiente" | "anulado"
export type StudentQuotaStatus = "al-dia" | "en-mora" | "restructurado"
export type PaymentMethod = "transferencia" | "tarjeta" | "deposito" | "efectivo"
export type PlanType = "mensual" | "trimestral" | "anual" | "personalizado"

export interface KardexRecord {
  id: string
  estudiante: string
  carnet: string
  programa: string
  concepto: string
  monto: number
  fecha: string
  estado: KardexStatus
  metodo: PaymentMethod
  referencia: string
  notas?: string
}

export interface StudentQuotaRecord {
  id: string
  estudiante: string
  carnet: string
  programa: string
  cuotasPendientes: number
  montoCuota: number
  proximaCuota: string
  estado: StudentQuotaStatus
  tipoPlan: PlanType
  notas?: string
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  deposito: "Depósito",
  efectivo: "Efectivo",
}

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  mensual: "Mensual",
  trimestral: "Trimestral",
  anual: "Anual",
  personalizado: "Personalizado",
}

export const KARDEX_STATUS_LABELS: Record<KardexStatus, string> = {
  aplicado: "Aplicado",
  pendiente: "Pendiente",
  anulado: "Anulado",
}

export const KARDEX_STATUS_CLASSES: Record<KardexStatus, string> = {
  aplicado: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  pendiente: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  anulado: "bg-red-500/15 text-red-700 border-red-500/30",
}

export const QUOTA_STATUS_LABELS: Record<StudentQuotaStatus, string> = {
  "al-dia": "Al día",
  "en-mora": "En mora",
  "restructurado": "Reestructurado",
}

export const QUOTA_STATUS_CLASSES: Record<StudentQuotaStatus, string> = {
  "al-dia": "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  "en-mora": "bg-red-500/15 text-red-600 border-red-500/30",
  "restructurado": "bg-blue-500/15 text-blue-700 border-blue-500/30",
}

export const DEFAULT_KARDEX_RECORDS: KardexRecord[] = [
  {
    id: "KP-001",
    estudiante: "Andrea Castillo",
    carnet: "20204567",
    programa: "Administración de Empresas",
    concepto: "Ajuste de pago febrero 2025",
    monto: 750,
    fecha: "2025-02-07",
    estado: "aplicado",
    metodo: "transferencia",
    referencia: "TR-928374",
    notas: "Ajuste registrado por conciliación bancaria.",
  },
  {
    id: "KP-002",
    estudiante: "Luis Martínez",
    carnet: "20215634",
    programa: "Ingeniería en Sistemas",
    concepto: "Reversión de pago duplicado",
    monto: -450,
    fecha: "2025-02-15",
    estado: "anulado",
    metodo: "tarjeta",
    referencia: "POS-55721",
    notas: "Pago duplicado anulado por tesorería.",
  },
  {
    id: "KP-003",
    estudiante: "María Fernanda Soto",
    carnet: "20206321",
    programa: "Psicología",
    concepto: "Aplicación de beca semestral",
    monto: -1200,
    fecha: "2025-01-30",
    estado: "aplicado",
    metodo: "transferencia",
    referencia: "AJ-2025-02",
    notas: "Beca aprobada por comité académico.",
  },
  {
    id: "KP-004",
    estudiante: "Diego Ramírez",
    carnet: "20217890",
    programa: "Arquitectura",
    concepto: "Pendiente de conciliar - abril",
    monto: 780,
    fecha: "2025-03-01",
    estado: "pendiente",
    metodo: "deposito",
    referencia: "DEP-33210",
    notas: "En espera de conciliación bancaria.",
  },
]

export const DEFAULT_STUDENT_QUOTAS: StudentQuotaRecord[] = [
  {
    id: "CT-001",
    estudiante: "Valentina Rojas",
    carnet: "20211023",
    programa: "Ingeniería Comercial",
    cuotasPendientes: 3,
    montoCuota: 680,
    proximaCuota: "2025-03-10",
    estado: "en-mora",
    tipoPlan: "mensual",
    notas: "Solicitó reprogramación con vencimiento el 15 de marzo.",
  },
  {
    id: "CT-002",
    estudiante: "Daniel López",
    carnet: "20209876",
    programa: "Diseño Gráfico",
    cuotasPendientes: 1,
    montoCuota: 520,
    proximaCuota: "2025-02-28",
    estado: "al-dia",
    tipoPlan: "trimestral",
    notas: "Plan trimestral con descuento activo.",
  },
  {
    id: "CT-003",
    estudiante: "Gabriela Hernández",
    carnet: "20213456",
    programa: "Medicina",
    cuotasPendientes: 5,
    montoCuota: 1250,
    proximaCuota: "2025-03-05",
    estado: "restructurado",
    tipoPlan: "personalizado",
    notas: "Plan ajustado por comité de becas desde enero 2025.",
  },
  {
    id: "CT-004",
    estudiante: "Kevin Morales",
    carnet: "20208765",
    programa: "Ingeniería Civil",
    cuotasPendientes: 2,
    montoCuota: 710,
    proximaCuota: "2025-03-12",
    estado: "en-mora",
    tipoPlan: "mensual",
    notas: "Atraso de 12 días, seguimiento por cobranza.",
  },
]

export const currencyFormatter = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
})

export const normalizeDateInput = (value: any) => {
  if (!value) {
    return new Date().toISOString().slice(0, 10)
  }
  if (value instanceof Date) {
    if (!Number.isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10)
    }
    return new Date().toISOString().slice(0, 10)
  }
  if (typeof value === "number") {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10)
    }
    return new Date().toISOString().slice(0, 10)
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) {
      return new Date().toISOString().slice(0, 10)
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed
    }
    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10)
    }
    return trimmed.slice(0, 10)
  }
  return new Date().toISOString().slice(0, 10)
}

export const formatDisplayDate = (value: string) => {
  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("es-GT")
  }
  return value
}
