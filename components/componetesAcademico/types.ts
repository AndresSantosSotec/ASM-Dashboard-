// src/components/componetesAcademico/types.ts
export interface PricePlan {
  id?: number
  inscripcion: number
  cuotaMensual: number
  meses: number
}

/**
 * 1:1 con tb_programas  (+ pricePlans).
 * Lo que no está en la BD se marca como opcional (?).
 */
export interface Programa {
  /* campos de la BD ----------------------------- */
  id:          number
  abreviatura: string
  nombre:      string            // nombre_del_programa
  meses:       number
  activo:      boolean
  createdAt:   string            // fecha_creacion
  pricePlans:  PricePlan[]

  /* ----------- SÓLO para la UI ----------------- */
  level?: string
  modality?: string
  totalSpots?: number
  availableSpots?: number
  cost?: number
  requirements?: string[]
}
