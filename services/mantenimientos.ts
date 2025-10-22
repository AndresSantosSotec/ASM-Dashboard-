import api from "./api"

export interface Prospecto {
  id: number
  status: string
  created_by?: number
}

export interface Mantenimiento {
  id: number
  descripcion: string
  fechaMantenimiento: string
  creadoPor?: number
}
