import type {
  KardexPagoResumen,
  ReconciliationRecordResumen,
} from "@/services/mantenimientos"
import type {
  LimitValue,
  PageSizeValue,
  ReportFilters,
} from "./types"

const MAX_FETCH_LIMIT = 100_000

const currencyFormatter = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
})

export const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return currencyFormatter.format(0)
  }

  return currencyFormatter.format(value)
}

export const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "-"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString("es-GT")
}

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "-"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString("es-GT")
}

export const estadoPagoLabels: Record<string, string> = {
  aprobado: "Aprobado",
  pendiente_revision: "Pendiente",
  rechazado: "Rechazado",
}

export const estadoPagoClasses: Record<string, string> = {
  aprobado: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  pendiente_revision: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  rechazado: "bg-red-500/15 text-red-600 border-red-500/30",
}

export const conciliacionLabels: Record<string, string> = {
  conciliado: "Conciliado",
  rechazado: "Rechazado",
  pendiente: "Pendiente",
  sin_coincidencia: "Sin coincidencia",
  imported: "Importado",
}

export const conciliacionClasses: Record<string, string> = {
  conciliado: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  rechazado: "bg-red-500/15 text-red-600 border-red-500/30",
  pendiente: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  sin_coincidencia: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  imported: "bg-slate-500/15 text-slate-700 border-slate-500/30",
}

export const cuotaEstadoLabels: Record<string, string> = {
  pagado: "Pagado",
  pendiente: "Pendiente",
  cancelado: "Cancelado",
  vencido: "Vencido",
}

export const cuotaEstadoClasses: Record<string, string> = {
  pagado: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  pendiente: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  cancelado: "bg-sky-500/15 text-sky-700 border-sky-500/30",
  vencido: "bg-red-500/15 text-red-600 border-red-500/30",
}

export const PAGE_SIZE_OPTIONS: Array<{ label: string; value: PageSizeValue }> = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "250", value: 250 },
  { label: "500", value: 500 },
  { label: "1000", value: 1000 },
  { label: "Todos", value: "all" },
]

export const LIMIT_OPTIONS: Array<{ label: string; value: LimitValue }> = [
  { label: "25 registros", value: 25 },
  { label: "50 registros", value: 50 },
  { label: "100 registros", value: 100 },
  { label: "200 registros", value: 200 },
  { label: "500 registros", value: 500 },
  { label: "1000 registros", value: 1000 },
  { label: "Todos (máx. 100k)", value: "all" },
]

const BASE_FILTERS: ReportFilters = {
  search: "",
  estadoPago: "todos",
  estadoReconciliacion: "todos",
  estadoCuota: "todos",
  limit: 100,
  fechaInicio: "",
  fechaFin: "",
  mes: "",
  ano: "",
}

export const createDefaultFilters = (): ReportFilters => ({
  ...BASE_FILTERS,
})

export const buildRequestFilters = (filters: ReportFilters) => ({
  search: filters.search || undefined,
  estado_pago: filters.estadoPago !== "todos" ? filters.estadoPago : undefined,
  estado_reconciliacion:
    filters.estadoReconciliacion !== "todos" ? filters.estadoReconciliacion : undefined,
  estado_cuota: filters.estadoCuota !== "todos" ? filters.estadoCuota : undefined,
  fecha_inicio: filters.fechaInicio || undefined,
  fecha_fin: filters.fechaFin || undefined,
  mes: filters.mes ? Number(filters.mes) : undefined,
  ano: filters.ano ? Number(filters.ano) : undefined,
  limit: filters.limit === "all" ? MAX_FETCH_LIMIT : filters.limit,
})

export const getKardexReference = (row: KardexPagoResumen) =>
  row.numero_boleta ? `Boleta ${row.numero_boleta}` : `Pago #${row.id}`

export const getReconciliationReference = (row: ReconciliationRecordResumen) =>
  row.reference ?? `Conciliación #${row.id}`

export const toDateInputValue = (value: string | null | undefined) => {
  if (!value) {
    return ""
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ""
  }

  const offset = parsed.getTimezoneOffset()
  const local = new Date(parsed.getTime() - offset * 60_000)

  return local.toISOString().slice(0, 10)
}

export const createKardexEditFormState = (row: KardexPagoResumen) => ({
  monto_pagado: row.monto_pagado != null ? String(row.monto_pagado) : "",
  fecha_pago: toDateInputValue(row.fecha_pago),
  fecha_recibo: toDateInputValue(row.fecha_recibo),
  metodo_pago: row.metodo_pago ?? "",
  estado_pago: row.estado_pago ?? "",
  numero_boleta: row.numero_boleta ?? "",
  banco: row.banco ?? "",
  observaciones: row.observaciones ?? "",
})

export const createReconciliationEditFormState = (
  row: ReconciliationRecordResumen,
) => ({
  amount: row.amount != null ? String(row.amount) : "",
  date: toDateInputValue(row.date),
  status: row.status ?? "",
  bank: row.bank ?? "",
  reference: row.reference ?? "",
})
