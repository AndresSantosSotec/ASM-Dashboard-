export interface Programa {
  id: number
  nombre_del_programa: string
  activo: boolean
}

export interface PrecioConvenioPrograma {
  id?: number
  convenio_id: number
  programa_id: number
  inscripcion: string
  cuota_mensual: string
  meses: number
  programa?: Programa
}

export interface Convenio {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
  precios_por_programa: PrecioConvenioPrograma[]
}

export interface ConvenioForm {
  nombre: string
  descripcion: string
  activo: boolean
}

export interface PrecioForm {
  programa_id: number | null
  inscripcion: string
  cuota_mensual: string
  meses: number | string
}
