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
  mes?: number | string // 🆕 Filtrar por mes (1-12)
  ano?: number | string // 🆕 Filtrar por año (YYYY)
  q?: string
  limit?: number
  page?: number
  per_page?: number
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
  id: number | null
  nombre: string
  carnet: string
  correo: string
  telefono?: string | null
}

export interface ProgramaResumen {
  id: number | null
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
  archivo_comprobante: string | null
  mes?: number | null // 🆕 Mes de referencia (1-12)
  ano?: number | null // 🆕 Año de referencia (YYYY)
  mes_pago?: string | null // 🆕 Mes del pago como texto (ej: "Octubre")
  anio_pago?: string | null // 🆕 Año del pago como texto (ej: "2025")
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
  archivo_comprobante?: string | null
}

export interface ReconciliationRecordResumen {
  id: number
  bank: string | null
  reference: string | null
  amount: number
  date: string | null
  status: string | null
  kardex_pago_id: number | null // ID del kardex de pago vinculado (null si no está vinculado)
  mes?: number | null // 🆕 Mes de referencia (1-12)
  ano?: number | null // 🆕 Año de referencia (YYYY)
  mes_pago?: string | null // 🆕 Mes del pago como texto (ej: "Octubre")
  anio_pago?: string | null // 🆕 Año del pago como texto (ej: "2025")
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
  archivo_comprobante: string | null
  prospecto: ProspectoResumen | null
  programa: ProgramaResumen | null
}

export interface KardexDataResponse {
  timestamp: string
  filters: Record<string, unknown>
  kardex: KardexPagoResumen[]
  reconciliaciones: ReconciliationRecordResumen[]
  cuotas: CuotaProgramaResumen[]
  pagination?: {
    current_page: number
    per_page: number
    total: number
    total_pages: number
    from: number
    to: number
  }
}

export interface CuotaPagoResumen {
  id: number
  fecha_pago: string | null
  monto_pagado: number
  estado_pago: string | null
  numero_boleta: string | null
  banco: string | null
  archivo_comprobante: string | null
}

export interface CuotaDetalladaResumen {
  id: number
  numero_cuota: number
  fecha_vencimiento: string | null
  monto: number
  estado: string | null
  paid_at: string | null
  concepto: string | null
  pagos?: CuotaPagoResumen[]
}

export interface CuotasDashboardEstudiante {
  estudiante_programa_id: number | null
  prospecto: (ProspectoResumen & { telefono?: string | null }) | null
  programa: ProgramaResumen | null
  saldo_pendiente: number | null
  cuotas_pendientes: number | null
  cuotas_pagadas: number | null
  proxima_cuota: CuotaDetalladaResumen | null
  cuotas: CuotaDetalladaResumen[]
}

export interface CuotasDashboardResumen {
  estudiantes_activos: number
  saldo_estimado: number
  en_mora: number
  planes_reestructurados: number
}

export interface Pagination {
  current_page: number
  per_page: number
  total: number
  total_pages: number
  from: number
  to: number
  has_more: boolean
}

export interface CuotasDashboardResponse {
  timestamp: string
  filters: Record<string, unknown>
  pagination?: Pagination
  summary: CuotasDashboardResumen
  estudiantes: CuotasDashboardEstudiante[]
}

export interface EstudianteActivoResumen {
  estudiante_programa_id: number | null
  prospecto_id: number | null
  nombre_completo: string
  carnet: string | null
  correo_electronico: string | null
  notas_pago: string | null
  nomenclatura: string | null
  status_actual: string | null
}

export interface EstudiantesActivosResponse {
  timestamp: string
  total_estudiantes_activos: number
  estudiantes: EstudianteActivoResumen[]
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
  params?: MantenimientosFilters & { module?: string }, // 🆕 Agregar módulo
  config?: AxiosRequestConfig,
): Promise<KardexDataResponse> => {
  const response = await api.get<KardexDataResponse>("/mantenimientos/kardex/datos", {
    ...(config ?? {}),
    params: sanitizeParams(params),
  })

  return response.data
}

export interface MantenimientosLiteOptionSet {
  bancos?: string[]
  estados?: string[]
}

export interface MantenimientosLiteResponse {
  timestamp: string
  module: 'kardex' | 'reconciliaciones' | 'cuotas'
  filters: Record<string, unknown>
  summary: {
    total: number
    monto_total: number
    aprobados?: number
    pendientes?: number
    conciliados?: number
    pagadas?: number
  }
  options: MantenimientosLiteOptionSet
  rows: Array<KardexPagoResumen | ReconciliationRecordResumen | CuotaProgramaResumen>
  pagination: {
    current_page: number
    per_page: number
    total: number
    total_pages: number
    from: number | null
    to: number | null
  }
}

export const getMantenimientosFinancierosLite = async (
  params?: MantenimientosFilters & {
    module?: 'kardex' | 'reconciliaciones' | 'cuotas'
    estado_pago?: string
    estado_reconciliacion?: string
    estado_cuota?: string
    banco?: string
    page?: number
    per_page?: number
  },
  config?: AxiosRequestConfig,
): Promise<MantenimientosLiteResponse> => {
  const response = await api.get<MantenimientosLiteResponse>('/mantenimientos/financieros-lite', {
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

type EstudiantesActivosFilters = MantenimientosFilters & { q?: string }

export const getEstudiantesActivos = async (
  params?: EstudiantesActivosFilters,
  config?: AxiosRequestConfig,
): Promise<EstudiantesActivosResponse> => {
  const sanitized = sanitizeParams(params) as (Record<string, unknown> & { q?: string }) | undefined
  let finalParams: (Record<string, unknown> & { q?: string }) | undefined

  if (sanitized) {
    finalParams = { ...sanitized }
    const searchValue = sanitized.search

    if (typeof searchValue === "string" && searchValue.trim().length > 0) {
      finalParams.q = searchValue.trim()
    }

    if ("search" in finalParams) {
      delete finalParams.search
    }
  }

  const response = await api.get<EstudiantesActivosResponse>("/mantenimientos/estudiantes/activos", {
    ...(config ?? {}),
    params: finalParams,
  })

  return response.data
}

// CRUD operations for Cuotas

export interface CuotaCreatePayload {
  estudiante_programa_id: number
  numero_cuota: number
  fecha_vencimiento: string
  monto: number
  estado?: string
  observaciones?: string
}

export interface CuotaUpdatePayload {
  numero_cuota?: number
  fecha_vencimiento?: string
  monto?: number
  estado?: string
  paid_at?: string | null
  concepto?: string | null
}

export interface CuotaListResponse {
  data: CuotaProgramaResumen[]
  pagination?: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export const getCuotas = async (
  params?: MantenimientosFilters & {
    carnet?: string
    estudiante_programa_id?: number
    page?: number
    limit?: number
  },
  config?: AxiosRequestConfig,
): Promise<CuotaListResponse> => {
  const response = await api.get<CuotaListResponse>("/mantenimientos/cuotas", {
    ...(config ?? {}),
    params: sanitizeParams(params),
  })

  return response.data
}

export const getCuota = async (id: number, config?: AxiosRequestConfig): Promise<CuotaProgramaResumen> => {
  const response = await api.get<CuotaProgramaResumen>(`/mantenimientos/cuotas/${id}`, config)
  return response.data
}

export const createCuota = async (
  payload: CuotaCreatePayload,
  config?: AxiosRequestConfig,
): Promise<CuotaProgramaResumen> => {
  const response = await api.post<CuotaProgramaResumen>("/mantenimientos/cuotas", payload, config)
  return response.data
}

export const updateCuota = async (
  id: number,
  payload: CuotaUpdatePayload,
  config?: AxiosRequestConfig,
): Promise<CuotaProgramaResumen> => {
  const response = await api.put<CuotaProgramaResumen>(`/mantenimientos/cuotas/${id}`, payload, config)
  return response.data
}

export const deleteCuota = async (id: number, config?: AxiosRequestConfig): Promise<void> => {
  await api.delete(`/mantenimientos/cuotas/${id}`, config)
}

export interface BulkUpdateCuotasPayload {
  ids: number[]
  fields: {
    monto?: number
    estado?: string
    fecha_vencimiento?: string
    paid_at?: string | null
    concepto?: string | null
  }
}

export interface BulkUpdateCuotasResponse {
  message: string
  affected: number
}

export const bulkUpdateCuotas = async (
  payload: BulkUpdateCuotasPayload,
  config?: AxiosRequestConfig,
): Promise<BulkUpdateCuotasResponse> => {
  const response = await api.post<BulkUpdateCuotasResponse>("/mantenimientos/cuotas/bulk-update", payload, config)
  return response.data
}

export interface BulkDeleteCuotasPayload {
  ids: number[]
}

export interface BulkDeleteCuotasResponse {
  message: string
  affected: number
  details: {
    cuotas_eliminadas: number
    kardex_eliminados: number
    reconciliaciones_eliminadas: number
  }
}

export const bulkDeleteCuotas = async (
  payload: BulkDeleteCuotasPayload,
  config?: AxiosRequestConfig,
): Promise<BulkDeleteCuotasResponse> => {
  const response = await api.post<BulkDeleteCuotasResponse>("/mantenimientos/cuotas/bulk-delete", payload, config)
  return response.data
}

export const uploadCuotaComprobante = async (
  cuotaId: number,
  file: File,
  config?: AxiosRequestConfig,
): Promise<{ message: string; archivo_comprobante: string; kardex_id: number }> => {
  const formData = new FormData()
  formData.append('comprobante', file)
  const response = await api.post(`/mantenimientos/cuotas/${cuotaId}/comprobante`, formData, {
    ...config,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

// CRUD operations for Kardex (Movimientos de Pago)

export interface KardexCreatePayload {
  estudiante_programa_id: number
  cuota_id?: number
  monto_pagado: number
  fecha_pago: string
  fecha_recibo?: string
  metodo_pago: string
  estado_pago?: string
  numero_boleta?: string
  banco?: string
  observaciones?: string
}

export interface KardexUpdatePayload {
  cuota_id?: number
  monto_pagado?: number
  fecha_pago?: string
  fecha_recibo?: string
  metodo_pago?: string
  estado_pago?: string
  numero_boleta?: string
  banco?: string
  observaciones?: string
}

export const getKardex = async (
  params?: MantenimientosFilters,
  config?: AxiosRequestConfig,
): Promise<{ data: KardexPagoResumen[]; pagination?: any }> => {
  const response = await api.get("/mantenimientos/kardex", {
    ...(config ?? {}),
    params: sanitizeParams(params),
  })
  const payload = response.data ?? {}
  if (Array.isArray(payload.kardex)) {
    return { data: payload.kardex, pagination: payload.pagination }
  }
  return {
    data: Array.isArray(payload.data) ? payload.data : [],
    pagination: payload.pagination,
  }
}

export const getKardexById = async (id: number, config?: AxiosRequestConfig): Promise<KardexPagoResumen> => {
  const response = await api.get<KardexPagoResumen>(`/mantenimientos/kardex/${id}`, config)
  return response.data
}

export const createKardex = async (
  payload: KardexCreatePayload,
  config?: AxiosRequestConfig,
): Promise<KardexPagoResumen> => {
  const response = await api.post<KardexPagoResumen>("/mantenimientos/kardex", payload, config)
  return response.data
}

export const updateKardex = async (
  id: number,
  payload: KardexUpdatePayload,
  config?: AxiosRequestConfig,
): Promise<KardexPagoResumen> => {
  const response = await api.put<KardexPagoResumen>(`/mantenimientos/kardex/${id}`, payload, config)
  return response.data
}

export const deleteKardex = async (id: number, config?: AxiosRequestConfig): Promise<void> => {
  await api.delete(`/mantenimientos/kardex/${id}`, config)
}

// CRUD operations for Reconciliaciones Bancarias

export interface ReconciliacionCreatePayload {
  prospecto_id?: number
  bank: string
  reference: string
  amount: number
  date: string
  status?: string
  kardex_pago_id?: number
}

export interface ReconciliacionUpdatePayload {
  prospecto_id?: number
  bank?: string
  reference?: string
  amount?: number
  date?: string
  status?: string
  kardex_pago_id?: number
}

export const getReconciliaciones = async (
  params?: MantenimientosFilters,
  config?: AxiosRequestConfig,
): Promise<{ data: ReconciliationRecordResumen[]; pagination?: any }> => {
  const response = await api.get("/mantenimientos/reconciliaciones", {
    ...(config ?? {}),
    params: sanitizeParams(params),
  })
  const payload = response.data ?? {}
  if (Array.isArray(payload.reconciliaciones)) {
    return { data: payload.reconciliaciones, pagination: payload.pagination }
  }
  return {
    data: Array.isArray(payload.data) ? payload.data : [],
    pagination: payload.pagination,
  }
}

export const getReconciliacionById = async (
  id: number,
  config?: AxiosRequestConfig,
): Promise<ReconciliationRecordResumen> => {
  const response = await api.get<ReconciliationRecordResumen>(`/mantenimientos/reconciliaciones/${id}`, config)
  return response.data
}

export const createReconciliacion = async (
  payload: ReconciliacionCreatePayload,
  config?: AxiosRequestConfig,
): Promise<ReconciliationRecordResumen> => {
  const response = await api.post<ReconciliationRecordResumen>("/mantenimientos/reconciliaciones", payload, config)
  return response.data
}

export const updateReconciliacion = async (
  id: number,
  payload: ReconciliacionUpdatePayload,
  config?: AxiosRequestConfig,
): Promise<ReconciliationRecordResumen> => {
  const response = await api.put<ReconciliationRecordResumen>(`/mantenimientos/reconciliaciones/${id}`, payload, config)
  return response.data
}

export const deleteReconciliacion = async (id: number, config?: AxiosRequestConfig): Promise<void> => {
  await api.delete(`/mantenimientos/reconciliaciones/${id}`, config)
}

// � VINCULACIÓN MANUAL DE CONCILIACIONES

export interface ConciliacionPendiente {
  id: number
  bank: string | null
  reference: string | null
  amount: number
  date: string | null
  status: string | null
  prospecto: ProspectoResumen | null
}

export interface RevisionManualKardexMatch {
  id: number
  numero_boleta: string | null
  banco: string | null
  monto_pagado: number
  fecha_pago: string | null
  estado_pago: string | null
}

export interface ConciliacionRevisionManual {
  id: number
  bank: string | null
  reference: string | null
  amount: number
  date: string | null
  status: string | null
  review_status: string | null
  prospecto_id: number | null
  kardex_pago_id: number | null
  match_count: number
  matches: RevisionManualKardexMatch[]
}

export interface KardexSugerencia {
  id: number
  match_percentage: number
  fecha_pago: string | null
  monto_pagado: number
  numero_boleta: string | null
  banco: string | null
  estado_pago: string | null
  prospecto: ProspectoResumen | null
  programa: ProgramaResumen | null
}

export const getConciliacionesPendientes = async (
  search?: string,
  config?: AxiosRequestConfig,
): Promise<{ conciliaciones: ConciliacionPendiente[] }> => {
  const params = new URLSearchParams()
  if (search && search.trim()) {
    params.append('q', search.trim())
  }
  const queryString = params.toString()
  const url = `/mantenimientos/reconciliaciones-pendientes${queryString ? '?' + queryString : ''}`
  const response = await api.get(url, config)
  return response.data
}

export const getConciliacionesRevisionManual = async (
  search?: string,
  config?: AxiosRequestConfig,
): Promise<{ conciliaciones: ConciliacionRevisionManual[]; total: number }> => {
  const params = new URLSearchParams()
  if (search && search.trim()) {
    params.append('q', search.trim())
  }
  const queryString = params.toString()
  const url = `/mantenimientos/reconciliaciones-revision-manual${queryString ? '?' + queryString : ''}`
  const response = await api.get(url, config)
  return response.data
}

export const buscarKardexParaVincular = async (
  conciliacionId: number,
  search?: string,
  config?: AxiosRequestConfig,
): Promise<{
  conciliacion: {
    id: number
    bank: string | null
    reference: string | null
    amount: number
    date: string | null
  }
  sugerencias: KardexSugerencia[]
}> => {
  const params = new URLSearchParams()
  params.append('conciliacion_id', String(conciliacionId))
  if (search && search.trim()) {
    params.append('q', search.trim())
  }
  const response = await api.get(`/mantenimientos/buscar-kardex-para-vincular?${params.toString()}`, config)
  return response.data
}

export const vincularConciliacionManual = async (
  conciliacionId: number,
  kardexPagoId: number,
  config?: AxiosRequestConfig,
): Promise<{ message: string }> => {
  const response = await api.post(
    '/mantenimientos/vincular-conciliacion-manual',
    {
      conciliacion_id: conciliacionId,
      kardex_pago_id: kardexPagoId,
    },
    config,
  )
  return response.data
}

export const desvincularConciliacion = async (
  conciliacionId: number,
  config?: AxiosRequestConfig,
): Promise<{ message: string }> => {
  const response = await api.post(`/mantenimientos/desvincular-conciliacion/${conciliacionId}`, {}, config)
  return response.data
}

// 🔍 DUPLICADOS DE CONCILIACIONES

export interface DuplicadoRegistro {
  id: number
  reference: string | null
  bank: string | null
  amount: number
  date: string | null
  status: string | null
  created_at: string | null
  prospecto_id: number | null
  nombre_alumno: string | null
  carnet: string | null
}

export interface DuplicadoGrupo {
  reference: string
  total: number
  montos_distintos: boolean
  conservar_id: number
  registros: DuplicadoRegistro[]
}

export interface DuplicadosResponse {
  resumen: { grupos_duplicados: number; registros_extra: number }
  grupos: DuplicadoGrupo[]
}

export const getReconciliacionesDuplicados = async (
  config?: AxiosRequestConfig,
): Promise<DuplicadosResponse> => {
  const response = await api.get('/mantenimientos/reconciliaciones-duplicados', config)
  return response.data
}

export const bulkDeleteReconciliaciones = async (
  ids: number[],
  config?: AxiosRequestConfig,
): Promise<{ message: string; eliminados: number; ignorados: number }> => {
  const response = await api.post('/mantenimientos/reconciliaciones-bulk-delete', { ids }, config)
  return response.data
}

// 📜 HISTORIAL DE AUDITORÍA

export interface HistorialVinculacion {
  id: number
  action: string
  fecha: string
  usuario: {
    id: number
    nombre: string
    email: string
  } | null
  conciliacion: {
    id: number
    banco: string | null
    referencia: string | null
    monto: number
    fecha: string | null
  } | null
  kardex: {
    id: number
    numero_boleta: string | null
    banco: string | null
    monto: number
    fecha: string | null
  } | null
  prospecto: {
    id: number
    nombre: string
    carnet: string | null
  } | null
  status_anterior: string | null
  status_nuevo: string | null
  observaciones: string | null
  metadata: any
}

export interface HistorialVinculacionesFilters {
  conciliacion_id?: number
  kardex_pago_id?: number
  prospecto_id?: number
  action?: string
  user_id?: number
  q?: string
  fecha_desde?: string
  fecha_hasta?: string
  limit?: number
}

export const getHistorialVinculaciones = async (
  filters?: HistorialVinculacionesFilters,
  config?: AxiosRequestConfig,
): Promise<{ historial: HistorialVinculacion[] }> => {
  const params = new URLSearchParams()
  if (filters?.conciliacion_id) params.append('conciliacion_id', String(filters.conciliacion_id))
  if (filters?.kardex_pago_id) params.append('kardex_pago_id', String(filters.kardex_pago_id))
  if (filters?.prospecto_id) params.append('prospecto_id', String(filters.prospecto_id))
  if (filters?.action) params.append('action', filters.action)
  if (filters?.user_id) params.append('user_id', String(filters.user_id))
  if (filters?.q) params.append('q', filters.q)
  if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde)
  if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta)
  if (filters?.limit) params.append('limit', String(filters.limit))

  const queryString = params.toString()
  const url = `/mantenimientos/historial-vinculaciones${queryString ? '?' + queryString : ''}`
  const response = await api.get(url, config)
  return response.data
}
// �🔍 Obtener estudiante_programa para Select (más simple que búsqueda)
export interface EstudianteProgramaSelect {
  estudiante_programa_id: number
  prospecto_id: number
  estudiante_nombre: string
  carnet: string
  correo: string
  programa_nombre: string
  programa_abreviatura: string | null
  label: string // "Juan Pérez (ASM2024123) - Bachelor of Business Administration"
}

export const getEstudiantesProgramaSelect = async (
  search?: string,
  config?: AxiosRequestConfig,
): Promise<{ data: EstudianteProgramaSelect[]; total: number }> => {
  const params = new URLSearchParams()
  if (search && search.trim()) {
    params.append('search', search.trim())
  }
  const queryString = params.toString()
  const url = `/mantenimientos/estudiante-programa/select${queryString ? '?' + queryString : ''}`
  const response = await api.get(url, config)
  return response.data
}

// ==================== ASISTENTE DE PAGO UNIFICADO ====================

/**
 * Línea de distribución del pago
 */
export interface PagoDistribucionLinea {
  estudiante_programa_id: number
  cuota_id?: number | null
  crear_cuota?: boolean
  cuota_nueva?: {
    numero_cuota?: number
    concepto?: string
    fecha_vencimiento?: string
  }
  monto: number
}

/**
 * Payload para el asistente de pago unificado
 */
export interface PagoAsistidoPayload {
  metodo_pago: string
  fecha_pago: string
  numero_boleta?: string
  banco?: string
  monto_total: number
  observaciones?: string
  distribucion: PagoDistribucionLinea[]
  crear_conciliacion?: boolean
  conciliacion_automatica?: boolean
}

/**
 * Respuesta del asistente de pago
 */
export interface PagoAsistidoResponse {
  message: string
  resumen: {
    monto_total: number
    kardex_creados: number
    cuotas_creadas: number
    cuotas_actualizadas: number
    conciliacion_creada: boolean
  }
  kardex: Array<{
    id: number
    estudiante_programa_id: number
    cuota_id: number | null
    monto_pagado: number
    estado_pago: string
    prospecto: string | null
    carnet: string | null
    programa: string | null
  }>
  cuotas_nuevas: Array<{
    id: number
    estudiante_programa_id: number
    numero_cuota: number
    monto: number
  }>
  cuotas_actualizadas: Array<{
    id: number
    numero_cuota: number
  }>
  conciliacion: {
    id: number
    bank: string
    reference: string
    amount: number
    status: string
  } | null
}

/**
 * Cuota pendiente para el asistente
 */
export interface CuotaPendienteAsistente {
  id: number
  numero_cuota: number
  concepto: string | null
  fecha_vencimiento: string | null
  monto: number
  monto_pagado: number
  saldo_pendiente: number
  estado: string
  vencida: boolean
}

/**
 * Respuesta de cuotas pendientes
 */
export interface CuotasPendientesAsistenteResponse {
  estudiante: {
    estudiante_programa_id: number
    nombre: string | null
    carnet: string | null
    programa: string | null
  }
  cuotas_pendientes: CuotaPendienteAsistente[]
  total_pendiente: number
}

export interface KardexDesajusteMensualidadRow {
  kardex_id: number
  fecha_pago: string | null
  numero_boleta: string | null
  banco: string | null
  estado_pago: string | null
  monto_pagado: number
  mensualidad_referencia: number
  es_mensualidad: boolean
  desajuste: boolean
  prospecto: {
    id: number | null
    nombre: string | null
    carnet: string | null
  }
  programa: {
    id: number | null
    nombre: string | null
  }
  cuota_actual: {
    id: number
    numero_cuota: number
    concepto: string | null
    monto: number
    estado: string | null
  } | null
  cuota_sugerida: {
    id: number
    numero_cuota: number
    concepto: string | null
    monto: number
    estado: string | null
  } | null
}

export interface KardexDesajustesMensualidadResponse {
  ok: boolean
  data: KardexDesajusteMensualidadRow[]
  pagination: {
    current_page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export interface ReasignacionServicioResponse {
  ok: boolean
  message: string
  data: {
    kardex_id: number
    reconciliation_record_id?: number | null
    monto_pagado?: number
    mensualidad_referencia?: number
    sin_cambios?: boolean
    mensaje?: string
    cuota_actual?: {
      id: number
      numero_cuota: number
      concepto: string | null
      monto: number
    }
    cuota_anterior?: {
      id: number
      numero_cuota: number
      concepto: string | null
      monto: number
    }
    cuota_destino?: {
      id: number
      numero_cuota: number
      concepto: string | null
      monto: number
    }
  }
}

/**
 * Crear pago mediante el asistente unificado
 */
export const crearPagoAsistido = async (
  payload: PagoAsistidoPayload,
  config?: AxiosRequestConfig,
): Promise<PagoAsistidoResponse> => {
  const response = await api.post<PagoAsistidoResponse>("/mantenimientos/pago-asistido", payload, config)
  return response.data
}

/**
 * Obtener cuotas pendientes de un estudiante para el asistente
 */
export const getCuotasPendientesAsistente = async (
  estudianteProgramaId: number,
  config?: AxiosRequestConfig,
): Promise<CuotasPendientesAsistenteResponse> => {
  const response = await api.get<CuotasPendientesAsistenteResponse>("/mantenimientos/cuotas-pendientes-asistente", {
    ...(config ?? {}),
    params: { estudiante_programa_id: estudianteProgramaId },
  })
  return response.data
}

export const getKardexDesajustesMensualidad = async (
  params?: { programa_id?: number; search?: string; page?: number; per_page?: number },
  config?: AxiosRequestConfig,
): Promise<KardexDesajustesMensualidadResponse> => {
  const response = await api.get<KardexDesajustesMensualidadResponse>(
    "/mantenimientos/kardex/desajustes-mensualidad",
    {
      ...(config ?? {}),
      params,
    },
  )
  return response.data
}

export const reasignarKardexAServicio = async (
  kardexId: number,
  payload?: { cuota_destino_id?: number; motivo?: string },
  config?: AxiosRequestConfig,
): Promise<ReasignacionServicioResponse> => {
  const response = await api.post<ReasignacionServicioResponse>(
    `/mantenimientos/kardex/${kardexId}/reasignar-servicio`,
    payload ?? {},
    config,
  )
  return response.data
}

export const reasignarConciliacionAServicio = async (
  conciliacionId: number,
  payload?: { cuota_destino_id?: number; motivo?: string },
  config?: AxiosRequestConfig,
): Promise<ReasignacionServicioResponse> => {
  const response = await api.post<ReasignacionServicioResponse>(
    `/mantenimientos/reconciliaciones/${conciliacionId}/reasignar-servicio`,
    payload ?? {},
    config,
  )
  return response.data
}
