import api from './api'

export interface AsignadorPreview {
  mes: string
  anio: number
  cursos_destino: number
  cursos_por_dia: Record<string, number>
  estudiantes_origen: number
  total_historial_users: number
  total_calificaciones: number
  listo: boolean
}

export interface ResultadoAsignacion {
  username: string
  nombre: string
  email: string
  plan: string
  curso_origen: string
  dia_origen: string
  curso_destino: string
  dia_destino: string
  estado: string
  cambio_dia: boolean
  tipo: 'ASIGNACION_AUTOMATICA' | 'SIN_ASIGNACION'
}

export interface AsignadorResultado {
  mes: string
  anio: number
  stats: {
    total_usuarios: number
    asignados: number
    sin_asignacion: number
    cambio_dia: number
    sin_regla: number
    sin_cupo: number
    bloqueado_aprobado: number
    sin_oferta: number
  }
  archivos_csv: Record<string, { path: string; count: number }>
  resultados: ResultadoAsignacion[]
  cupos_finales: Record<string, number>
}

export async function fetchAsignadorPreview(mes: string, anio: number): Promise<AsignadorPreview> {
  const { data } = await api.get('/academico/asignador/preview', { params: { mes, anio } })
  return data
}

export async function ejecutarAsignacion(
  mes: string,
  anio: number,
  maxCupo = 35,
  umbral = 65
): Promise<AsignadorResultado> {
  const { data } = await api.post(
    '/academico/asignador/ejecutar',
    { mes, anio, max_cupo: maxCupo, umbral_historial: umbral },
    { timeout: 300_000 } // 5 min — el algoritmo puede tardar
  )
  return data
}

/** Descarga el CSV de un día directamente usando axios (incluye Bearer token automáticamente) */
export async function descargarCsvDia(dia: string, mes: string, anio: number): Promise<void> {
  const response = await api.get(`/academico/asignador/descargar/${encodeURIComponent(dia)}`, {
    params: { mes, anio },
    responseType: 'blob',
  })
  const url  = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href  = url
  const diaSlug = dia.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  link.setAttribute('download', `Moodle_${diaSlug}_${mes}${anio}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
