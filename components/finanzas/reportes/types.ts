// Tipos compartidos para los componentes de reportes financieros

export type LimitValue = number | "all"
export type PageSizeValue = number | "all"

export interface ReportFilters {
  search: string
  estadoPago: string
  estadoReconciliacion: string
  estadoCuota: string
  limit: LimitValue
  fechaInicio?: string
  fechaFin?: string
  mes?: number | string
  ano?: number | string
}

export type TabKey = "kardex" | "reconciliaciones" | "cuotas" | "generacion-masiva"
export type PaginationKey =
  | "kardex"
  | "reconciliaciones"
  | "cuotasEstudiantes"
  | "cuotas"
  | "bulkEstudiantes"

export interface PaginationState {
  page: number
  pageSize: PageSizeValue
}
