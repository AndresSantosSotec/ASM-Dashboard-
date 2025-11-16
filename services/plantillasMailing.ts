import api from "./api"

// ==================== TYPES ====================

export interface EmailTemplate {
  id: number
  nombre: string
  asunto: string
  contenido_html: string
  contenido_texto?: string
  tipo: 'correo' | 'documento'
  categoria: 'bienvenida' | 'recordatorio' | 'notificacion' | 'invitacion' | 'certificado' | 'general'
  variables_disponibles?: string[]
  activo: boolean
  descripcion?: string
  creado_por?: number
  actualizado_por?: number
  created_at?: string
  updated_at?: string
}

export interface EmailSending {
  id: number
  template_id: number
  asunto: string
  total_destinatarios: number
  enviados: number
  fallidos: number
  abiertos: number
  estado: 'programado' | 'enviando' | 'completado' | 'fallido' | 'cancelado'
  fecha_programada?: string
  fecha_inicio_envio?: string
  fecha_fin_envio?: string
  filtros_aplicados?: Record<string, any>
  destinatarios?: number[]
  notas?: string
  enviado_por?: number
  tasa_apertura?: number
  tasa_exito?: number
  template?: Pick<EmailTemplate, 'id' | 'nombre'>
  enviado_por_usuario?: { id: number; name: string }
  created_at?: string
  updated_at?: string
}

export interface EmailLog {
  id: number
  sending_id?: number
  template_id?: number
  destinatario_email: string
  destinatario_nombre?: string
  prospecto_id?: number
  asunto: string
  contenido_html?: string
  estado: 'enviado' | 'fallido' | 'rebotado' | 'spam'
  fecha_envio?: string
  fecha_apertura?: string
  veces_abierto: number
  error_mensaje?: string
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface Variable {
  nombre: string
  descripcion: string
  ejemplo: string
}

export interface PlantillasFilters {
  tipo?: 'all' | 'correo' | 'documento'
  categoria?: 'all' | 'bienvenida' | 'recordatorio' | 'notificacion' | 'invitacion' | 'certificado' | 'general'
  activo?: boolean
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  perPage?: number
}

export interface EnviosFilters {
  template_id?: 'all' | number
  estado?: 'all' | 'programado' | 'enviando' | 'completado' | 'fallido' | 'cancelado'
  fecha_desde?: string
  fecha_hasta?: string
  page?: number
  perPage?: number
}

export interface EnvioMasivoPayload {
  template_id: number
  asunto?: string
  tipo_destinatarios: 'todos' | 'filtrado' | 'manual'
  filtros?: {
    programa_id?: 'all' | number
    activo?: boolean
    tiene_email?: boolean
    estado?: string
    fecha_registro_desde?: string
    fecha_registro_hasta?: string
  }
  destinatarios_manuales?: number[]
  enviar_inmediato?: boolean
  fecha_programada?: string
  notas?: string
}

// ==================== API CALLS ====================

// Plantillas
export const fetchPlantillas = async (filters?: PlantillasFilters) => {
  const params = new URLSearchParams()
  if (filters?.tipo && filters.tipo !== 'all') params.append('tipo', filters.tipo)
  if (filters?.categoria && filters.categoria !== 'all') params.append('categoria', filters.categoria)
  if (filters?.activo !== undefined) params.append('activo', String(filters.activo))
  if (filters?.search) params.append('search', filters.search)
  if (filters?.sortBy) params.append('sortBy', filters.sortBy)
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)
  if (filters?.page) params.append('page', String(filters.page))
  if (filters?.perPage) params.append('perPage', String(filters.perPage))

  const response = await api.get(`/administracion/plantillas-mailing?${params.toString()}`)
  return response.data
}

export const fetchPlantilla = async (id: number) => {
  const response = await api.get(`/administracion/plantillas-mailing/${id}`)
  return response.data
}

export const createPlantilla = async (data: Partial<EmailTemplate>) => {
  const response = await api.post('/administracion/plantillas-mailing', data)
  return response.data
}

export const updatePlantilla = async (id: number, data: Partial<EmailTemplate>) => {
  const response = await api.put(`/administracion/plantillas-mailing/${id}`, data)
  return response.data
}

export const deletePlantilla = async (id: number) => {
  const response = await api.delete(`/administracion/plantillas-mailing/${id}`)
  return response.data
}

export const duplicatePlantilla = async (id: number) => {
  const response = await api.post(`/administracion/plantillas-mailing/${id}/duplicar`)
  return response.data
}

export const previewPlantilla = async (id: number, variables?: Record<string, string>) => {
  const response = await api.post(`/administracion/plantillas-mailing/${id}/preview`, { variables })
  return response.data
}

// Variables
export const fetchVariables = async () => {
  const response = await api.get('/administracion/plantillas-mailing/variables')
  return response.data as Variable[]
}

// Envíos
export const fetchEnvios = async (filters?: EnviosFilters) => {
  const params = new URLSearchParams()
  if (filters?.template_id && filters.template_id !== 'all') params.append('template_id', String(filters.template_id))
  if (filters?.estado && filters.estado !== 'all') params.append('estado', filters.estado)
  if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde)
  if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta)
  if (filters?.page) params.append('page', String(filters.page))
  if (filters?.perPage) params.append('perPage', String(filters.perPage))

  const response = await api.get(`/administracion/plantillas-mailing/envios?${params.toString()}`)
  return response.data
}

export const fetchEnvio = async (id: number) => {
  const response = await api.get(`/administracion/plantillas-mailing/envios/${id}`)
  return response.data
}

export const enviarMasivo = async (payload: EnvioMasivoPayload) => {
  const response = await api.post('/administracion/plantillas-mailing/enviar', payload)
  return response.data
}

export const cancelarEnvio = async (id: number) => {
  const response = await api.post(`/administracion/plantillas-mailing/envios/${id}/cancelar`)
  return response.data
}

// ==================== NUEVOS ENDPOINTS ====================

export interface KPIData {
  correos_enviados: number
  tasa_apertura_promedio: number
  proximos_envios: EmailSending[]
  plantillas_populares: Array<{ id: number; nombre: string; categoria: string; envios_count: number }>
  periodo_dias: number
}

export interface ActivityLogItem {
  id: number
  user_id?: number
  entity_type: 'template' | 'sending' | 'segment'
  entity_id?: number
  action: string
  description?: string
  meta?: Record<string, any>
  ip_address?: string
  user_agent?: string
  user?: { id: number; name: string }
  created_at: string
}

export interface SavedSegment {
  id: number
  nombre: string
  descripcion?: string
  filtros: Record<string, any>
  total_destinatarios: number
  created_by?: number
  updated_by?: number
  last_used_at?: string
  use_count: number
  created_at?: string
  updated_at?: string
}

export const fetchKPIs = async (dias: number = 30) => {
  const response = await api.get(`/administracion/plantillas-mailing/kpis?dias=${dias}`)
  return response.data as KPIData
}

export const fetchRecentPlantillas = async () => {
  const response = await api.get('/administracion/plantillas-mailing/recent')
  return response.data as EmailTemplate[]
}

export const fetchActivity = async (filters?: {
  entity_type?: string
  action?: string
  entity_id?: number
  user_id?: number
  fecha_desde?: string
  fecha_hasta?: string
  page?: number
  perPage?: number
}) => {
  const params = new URLSearchParams()
  if (filters?.entity_type) params.append('entity_type', filters.entity_type)
  if (filters?.action) params.append('action', filters.action)
  if (filters?.entity_id) params.append('entity_id', String(filters.entity_id))
  if (filters?.user_id) params.append('user_id', String(filters.user_id))
  if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde)
  if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta)
  if (filters?.page) params.append('page', String(filters.page))
  if (filters?.perPage) params.append('perPage', String(filters.perPage))

  const response = await api.get(`/administracion/plantillas-mailing/activity?${params.toString()}`)
  return response.data
}

export const fetchVersions = async (templateId: number) => {
  const response = await api.get(`/administracion/plantillas-mailing/${templateId}/versions`)
  return response.data
}

export const restoreVersion = async (templateId: number, versionId: number) => {
  const response = await api.post(`/administracion/plantillas-mailing/${templateId}/restore-version`, {
    version_id: versionId
  })
  return response.data
}

export const previewBatch = async (templateId: number, destinatariosIds: number[]) => {
  const response = await api.post('/administracion/plantillas-mailing/preview-batch', {
    template_id: templateId,
    destinatarios_ids: destinatariosIds
  })
  return response.data
}

// Segmentos
export const fetchSegments = async (search?: string) => {
  const params = search ? `?search=${encodeURIComponent(search)}` : ''
  const response = await api.get(`/administracion/segmentos${params}`)
  return response.data as SavedSegment[]
}

export const createSegment = async (data: { nombre: string; descripcion?: string; filtros: Record<string, any> }) => {
  const response = await api.post('/administracion/segmentos', data)
  return response.data as SavedSegment
}

export const updateSegment = async (id: number, data: Partial<{ nombre: string; descripcion?: string; filtros: Record<string, any> }>) => {
  const response = await api.put(`/administracion/segmentos/${id}`, data)
  return response.data as SavedSegment
}

export const deleteSegment = async (id: number) => {
  const response = await api.delete(`/administracion/segmentos/${id}`)
  return response.data
}
