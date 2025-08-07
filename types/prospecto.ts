import type { Program as Programa } from '@/services/programs'

export interface EstudiantePrograma {
  id: number
  prospecto_id: number
  programa_id: number
  programa: Programa
}

/** Prospecto básico */
export interface Prospecto {
  id: number
  nombre_completo: string
  status: string
  puesto?: string

}

/** Prospecto con programas cargados */
export interface ProspectoConProgramas extends Prospecto {
  programas: EstudiantePrograma[]
  courses: any[] // deja courses si ya lo manejas
}
