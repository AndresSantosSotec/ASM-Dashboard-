import api from './api'
import type { Documento } from '@/components/inscripcion/types'

/**
 * Obtiene documentos del prospecto que están en estado de revisión.
 */
export async function fetchDocumentosRevision(
  prospectoId: number,
): Promise<Documento[]> {
  try {
    const { data } = await api.get(`/documentos/prospecto/${prospectoId}`)
    if (!Array.isArray(data)) return []
    return data
      .filter((d: any) => d.estado === 'revision')
      .map((d: any) => ({
        ...d,
        estado: d.estado ?? (d.url ? 'cargado' : 'pendiente'),
      }))
  } catch {
    return []
  }
}

export default fetchDocumentosRevision
