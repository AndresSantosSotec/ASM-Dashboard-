// services/mailing.ts
import api from "./api"

/* =========================
   Tipos de Plantillas
========================= */

export interface EmailTemplate {
  id: number
  nombre: string
  descripcion?: string
  asunto?: string // 🔥 Opcional porque puede venir undefined
  cuerpo?: string // 🔥 Campo que puede venir del frontend
  contenido_html?: string // 🔥 Campo que viene del backend (BD tiene este campo)
  contenido_texto?: string // 🔥 Campo que viene del backend (BD tiene este campo)
  cuerpo_texto?: string
  tipo: "email" | "whatsapp" | "sms" | "correo" // 🔥 Agregado "correo" para compatibilidad con BD
  categoria: "recordatorio" | "bienvenida" | "seguimiento" | "promocion" | "notificacion" | "otro"
  variables_disponibles?: string[]
  activo: boolean
  creado_por?: number
  actualizado_por?: number
  created_at?: string
  updated_at?: string
  estadisticas?: {
    totalEnvios: number
    totalCorreosEnviados: number
    totalAbiertos: number
    ultimoEnvio?: string
  }
}

export interface TemplateVersion {
  id: number
  template_id: number
  version_number: number
  asunto: string
  cuerpo: string
  cambios?: string
  creado_por?: number
  created_at: string
}

export interface EmailSending {
  id: number
  template_id?: number
  nombre_campana: string
  descripcion?: string
  tipo_envio: "email" | "whatsapp" | "sms"
  estado: "programado" | "en_progreso" | "completado" | "cancelado" | "fallido"
  segmento?: any
  total_destinatarios: number
  total_enviados: number
  total_fallidos: number
  programado_para?: string
  iniciado_en?: string
  completado_en?: string
  cancelado_en?: string
  creado_por?: number
  created_at?: string
  updated_at?: string
  template?: EmailTemplate
}

export interface EmailLog {
  id: number
  envio_id?: number
  template_id?: number
  destinatario_tipo: string
  destinatario_id: number
  correo_destinatario: string
  asunto: string
  estado: "pendiente" | "enviado" | "fallido" | "rebotado" | "abierto" | "clicked"
  fecha_envio?: string
  fecha_apertura?: string
  fecha_click?: string
  error?: string
  ip_apertura?: string
  user_agent?: string
  created_at?: string
}

export interface SavedSegment {
  id: number
  nombre: string
  descripcion?: string
  filtros: any
  total_destinatarios: number
  creado_por?: number
  created_at?: string
  updated_at?: string
}

export interface TemplateKPIs {
  totalPlantillas: number
  totalActivas: number
  totalEnvios: number
  totalEnviados: number
  tasaApertura: number
  plantillasMasUsadas: Array<{
    id: number
    nombre: string
    total_envios: number
  }>
}

export interface TemplateActivity {
  ultimasPlantillas: EmailTemplate[]
  ultimosEnvios: EmailSending[]
}

export interface PreviewResult {
  prospecto_id: number
  prospecto_nombre: string
  asunto: string
  cuerpo: string
}

/* =========================
   Funciones del servicio
========================= */

/**
 * Obtener lista de plantillas
 */
export const getPlantillas = async (params?: {
  tipo?: "email" | "whatsapp" | "sms" | "all" | "correo" // 🔥 Agregado "correo" para compatibilidad con BD
  categoria?: string | "all"
  activo?: boolean
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
  perPage?: number
  page?: number
}): Promise<{
  data: EmailTemplate[]
  current_page: number
  total: number
  per_page: number
  last_page: number
}> => {
  // 🔥 Mapear "correo" a "email" para el backend, pero mantener compatibilidad
  const backendParams = params ? { ...params } : {}
  if (backendParams.tipo === "correo") {
    backendParams.tipo = "email" as any
  }
  
  const res = await api.get("/administracion/plantillas-mailing", { params: backendParams })
  return res.data
}

/**
 * Obtener plantilla específica por ID
 */
export const getPlantilla = async (id: number): Promise<EmailTemplate> => {
  const res = await api.get(`/administracion/plantillas-mailing/${id}`)
  return res.data
}

/**
 * Crear nueva plantilla
 */
export const createPlantilla = async (data: Partial<EmailTemplate>): Promise<EmailTemplate> => {
  const res = await api.post("/administracion/plantillas-mailing", data)
  return res.data
}

/**
 * Actualizar plantilla existente
 */
export const updatePlantilla = async (id: number, data: Partial<EmailTemplate>): Promise<EmailTemplate> => {
  const res = await api.put(`/administracion/plantillas-mailing/${id}`, data)
  return res.data
}

/**
 * Eliminar plantilla
 */
export const deletePlantilla = async (id: number): Promise<void> => {
  await api.delete(`/administracion/plantillas-mailing/${id}`)
}

/**
 * Duplicar plantilla
 */
export const duplicatePlantilla = async (id: number): Promise<EmailTemplate> => {
  const res = await api.post(`/administracion/plantillas-mailing/${id}/duplicar`)
  return res.data
}

/**
 * Obtener variables disponibles para plantillas
 */
export const getVariablesDisponibles = async (): Promise<{
  variables: Array<{
    variable: string
    descripcion: string
    ejemplo: string
    categoria: string
  }>
}> => {
  const res = await api.get("/administracion/plantillas-mailing/variables")
  return res.data
}

/**
 * Obtener plantillas recientes
 */
export const getPlantillasRecientes = async (limit = 5): Promise<EmailTemplate[]> => {
  const res = await api.get("/administracion/plantillas-mailing/recent", {
    params: { limit },
  })
  return res.data.data || res.data
}

/**
 * Obtener KPIs de plantillas
 */
export const getPlantillasKPIs = async (): Promise<TemplateKPIs> => {
  const res = await api.get("/administracion/plantillas-mailing/kpis")
  return res.data
}

/**
 * Obtener actividad reciente
 */
export const getPlantillasActivity = async (): Promise<TemplateActivity> => {
  const res = await api.get("/administracion/plantillas-mailing/activity")
  return res.data
}

/**
 * Preview de plantilla con prospecto específico
 */
export const previewPlantilla = async (
  id: number,
  prospectoId: number
): Promise<PreviewResult> => {
  const res = await api.post(`/administracion/plantillas-mailing/${id}/preview`, {
    prospecto_id: prospectoId,
  })
  return res.data
}

/**
 * Preview en batch (múltiples prospectos)
 */
export const previewPlantillaBatch = async (
  templateId: number,
  prospectoIds: number[]
): Promise<PreviewResult[]> => {
  const res = await api.post("/administracion/plantillas-mailing/preview-batch", {
    template_id: templateId,
    prospecto_ids: prospectoIds,
  })
  return res.data.previews || res.data
}

/**
 * Obtener versiones de una plantilla
 */
export const getPlantillaVersions = async (id: number): Promise<TemplateVersion[]> => {
  const res = await api.get(`/administracion/plantillas-mailing/${id}/versions`)
  return res.data.data || res.data
}

/**
 * Restaurar versión de plantilla
 */
export const restorePlantillaVersion = async (
  id: number,
  versionId: number
): Promise<EmailTemplate> => {
  const res = await api.post(`/administracion/plantillas-mailing/${id}/restore-version`, {
    version_id: versionId,
  })
  return res.data
}

/**
 * Obtener envíos/campañas
 */
export const getEnvios = async (params?: {
  estado?: string
  tipo_envio?: string
  fecha_desde?: string
  fecha_hasta?: string
  page?: number
  perPage?: number
}): Promise<{
  data: EmailSending[]
  current_page: number
  total: number
  per_page: number
  last_page: number
}> => {
  const res = await api.get("/administracion/plantillas-mailing/envios", { params })
  return res.data
}

/**
 * Obtener envío específico por ID
 */
export const getEnvio = async (id: number): Promise<EmailSending> => {
  const res = await api.get(`/administracion/plantillas-mailing/envios/${id}`)
  return res.data
}

/**
 * Enviar campaña masiva
 */
export const enviarMasivo = async (data: {
  template_id: number
  nombre_campana: string
  descripcion?: string
  segmento?: any
  prospecto_ids?: number[]
  programar?: boolean
  fecha_programada?: string
}): Promise<EmailSending> => {
  const res = await api.post("/administracion/plantillas-mailing/enviar", data)
  return res.data
}

/**
 * Cancelar envío programado
 */
export const cancelarEnvio = async (id: number): Promise<void> => {
  await api.post(`/administracion/plantillas-mailing/envios/${id}/cancelar`)
}

/* =========================
   Segmentos
========================= */

/**
 * Obtener segmentos guardados
 */
export const getSegmentos = async (): Promise<SavedSegment[]> => {
  const res = await api.get("/administracion/segmentos")
  return res.data.data || res.data
}

/**
 * Crear nuevo segmento
 */
export const createSegmento = async (data: Partial<SavedSegment>): Promise<SavedSegment> => {
  const res = await api.post("/administracion/segmentos", data)
  return res.data
}

/**
 * Actualizar segmento
 */
export const updateSegmento = async (
  id: number,
  data: Partial<SavedSegment>
): Promise<SavedSegment> => {
  const res = await api.put(`/administracion/segmentos/${id}`, data)
  return res.data
}

/**
 * Eliminar segmento
 */
export const deleteSegmento = async (id: number): Promise<void> => {
  await api.delete(`/administracion/segmentos/${id}`)
}
