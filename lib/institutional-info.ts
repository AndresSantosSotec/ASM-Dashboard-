/**
 * Información institucional centralizada - Gaia Business School.
 * Usada en recibos, PDFs y documentos generados.
 * Logos eliminados: se usa solo texto "Gaia Business School".
 */
export const INSTITUTIONAL_INFO = {
  organizationName: "Gaia Business School",
  address: "Torre Tigo, Km. 9.5 Carretera al Salvador, Oficina 6C",
  phone: "Cel. 5486-2301",
} as const

export type InstitutionalInfo = {
  organizationName: string
  address: string
  phone: string
}

/**
 * Combinar defaults con datos de customization cuando existan.
 */
export function mergeInstitutionalInfo(customization?: {
  organization_name?: string | null
} | null): InstitutionalInfo {
  return {
    organizationName: customization?.organization_name || INSTITUTIONAL_INFO.organizationName,
    address: INSTITUTIONAL_INFO.address,
    phone: INSTITUTIONAL_INFO.phone,
  }
}
