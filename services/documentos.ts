import api from './api'
import type { Documento } from '@/components/inscripcion/types'

/**
 * Obtiene documentos del prospecto que están en estado de revisión.
 * Con latestIteration=true solo trae los de la iteración actual (después de retrocesos).
 */
export async function fetchDocumentosRevision(
  prospectoId: number,
  latestIteration: boolean = true,
): Promise<Documento[]> {
  try {
    const params = latestIteration ? '?latest_iteration=1' : ''
    const { data } = await api.get(`/documentos/prospecto/${prospectoId}${params}`)
    if (!Array.isArray(data)) return []
    return data.map((d: any) => ({
      ...d,
      estado: d.estado ?? (d.url ? 'cargado' : 'pendiente'),
    }))
  } catch {
    return []
  }
}

export default fetchDocumentosRevision
