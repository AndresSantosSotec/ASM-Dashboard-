import type { AxiosRequestConfig } from "axios"
import api from "./api"

export interface MantenimientosFilters {
  prospecto_id?: number | string
  programa_id?: number | string
  estado?: string
  estado_pago?: string
  estado_cuota?: string
  estado_reconciliacion?: string
  search?: string
  fecha_inicio?: string
  fecha_fin?: string
  limit?: number
}

export interface KardexDashboardMetrics {
  movimientos_registrados: number
  monto_neto: number
  aplicados: number
  pendientes: number
  rechazados: number
}

export interface ReconciliationDashboardMetrics {
  total: number
  monto_total: number
  conciliados: number
  rechazados: number
  pendientes: number
}

export interface CuotasDashboardMetrics {
  total: number
  pendientes: number
  en_mora: number
  monto_pendiente: number
}

export interface KardexDashboardResponse {
  timestamp: string
  filters: Record<string, unknown>
  kardex: KardexDashboardMetrics
  reconciliaciones: ReconciliationDashboardMetrics
  cuotas: CuotasDashboardMetrics
}

export interface ProspectoResumen {
  id: number
  nombre: string
  carnet: string
  correo: string
  telefono?: string | null
}

export interface ProgramaResumen {
  id: number
  nombre: string
}

export interface KardexCuotaResumen {
  id: number
  numero_cuota: number
  fecha_vencimiento: string | null
  monto: number
  estado: string | null
  paid_at: string | null
}

export interface KardexReconciliationResumen {
  id: number
  bank: string | null
  reference: string | null
  amount: number
  date: string | null
  status: string | null
}

export interface KardexPagoResumen {
  id: number
  fecha_pago: string | null
  fecha_recibo: string | null
  monto_pagado: number
  metodo_pago: string | null
  estado_pago: string | null
  numero_boleta: string | null
  banco: string | null
  observaciones: string | null
  prospecto: ProspectoResumen | null
  programa: ProgramaResumen | null
  cuota: KardexCuotaResumen | null
  reconciliaciones: KardexReconciliationResumen[]
}

export interface KardexRelacionadoResumen {
  id: number
  fecha_pago?: string | null
  monto_pagado?: number
  estado_pago?: string | null
}

export interface ReconciliationRecordResumen {
  id: number
  bank: string | null
  reference: string | null
  amount: number
  date: string | null
  status: string | null
  prospecto: ProspectoResumen | null
  kardex: KardexRelacionadoResumen | null
  programa: ProgramaResumen | null
}

export interface CuotaProgramaResumen {
  id: number
  numero_cuota: number
  fecha_vencimiento: string | null
  monto: number
  estado: string | null
  paid_at: string | null
  prospecto: ProspectoResumen | null
  programa: ProgramaResumen | null
}

export interface KardexDataResponse {
  timestamp: string
  filters: Record<string, unknown>
  kardex: KardexPagoResumen[]
  reconciliaciones: ReconciliationRecordResumen[]
  cuotas: CuotaProgramaResumen[]
}

export interface CuotaDetalladaResumen {
  id: number
  numero_cuota: number
  fecha_vencimiento: string | null
  monto: number
  estado: string | null
  paid_at: string | null
}

export interface CuotasDashboardEstudiante {
  estudiante_programa_id: number | null
  prospecto: (ProspectoResumen & { telefono?: string | null }) | null
  programa: ProgramaResumen | null
  saldo_pendiente: number
  cuotas_pendientes: number
  cuotas_pagadas: number
  proxima_cuota: CuotaDetalladaResumen | null
  cuotas: CuotaDetalladaResumen[]
}

export interface CuotasDashboardResumen {
  estudiantes_activos: number
  saldo_estimado: number
  en_mora: number
  planes_reestructurados: number
}

export interface CuotasDashboardResponse {
  timestamp: string
  filters: Record<string, unknown>
  summary: CuotasDashboardResumen
  estudiantes: CuotasDashboardEstudiante[]
}

export interface EstudianteActivoProgramaResumen {
  estudiante_programa_id: number
  programa_id: number | null
  programa_nombre: string | null
}

export interface EstudianteActivoResumen {
  id: number
  nombre: string
  carnet: string
  correo: string
  telefono: string | null
  programas: EstudianteActivoProgramaResumen[]
}

export interface EstudiantesActivosResponse {
  timestamp: string
  filters: Record<string, unknown>
  data: EstudianteActivoResumen[]
}

const sanitizeParams = (params?: MantenimientosFilters) => {
  if (!params) {
    return undefined
  }

  const entries = Object.entries(params).filter(([, value]) => {
    if (value === undefined || value === null || value === "") {
      return false
    }

    return true
  })

  if (entries.length === 0) {
    return undefined
  }

  return Object.fromEntries(entries)
}

export const getKardexDashboard = async (
  params?: MantenimientosFilters,
  config?: AxiosRequestConfig,
): Promise<KardexDashboardResponse> => {
  const response = await api.get<KardexDashboardResponse>("/mantenimientos/kardex/dashboard", {
    ...(config ?? {}),
    params: sanitizeParams(params),
  })

  return response.data
}

export const getKardexData = async (
  params?: MantenimientosFilters,
  config?: AxiosRequestConfig,
): Promise<KardexDataResponse> => {
  const response = await api.get<KardexDataResponse>("/mantenimientos/kardex/datos", {
    ...(config ?? {}),
    params: sanitizeParams(params),
  })

  return response.data
}

export const getCuotasDashboard = async (
  params?: MantenimientosFilters,
  config?: AxiosRequestConfig,
): Promise<CuotasDashboardResponse> => {
  const response = await api.get<CuotasDashboardResponse>("/mantenimientos/cuotas/dashboard", {
    ...(config ?? {}),
    params: sanitizeParams(params),
  })

  return response.data
}

export const getEstudiantesActivos = async (
  params?: MantenimientosFilters,
  config?: AxiosRequestConfig,
): Promise<EstudiantesActivosResponse> => {
  const response = await api.get<EstudiantesActivosResponse>("/mantenimientos/estudiantes/activos", {
    ...(config ?? {}),
    params: sanitizeParams(params),
  })

  return response.data
}
