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

export interface Documento {
  id: number
  tipo_documento: string
  ruta_archivo: string
  estado: string
}

export interface Convenio {
  id: number
  nombre: string
  descuento: number
}

export interface Course {
  id: number
  fullname: string
}

export interface ProgramaInscrito {
  id: number
  modalidad: string
  fecha_inicio_especifica: string | null
  fecha_taller_reduccion: string | null
  fecha_taller_integracion: string | null
  anio_graduacion: number | null
  cantidad_cursos_aprobados: number | null
  dia_estudio: string | null
  programa: Programa
}

/** Prospecto con toda la información relacionada */
export interface ProspectoDetalle extends Prospecto {
  fecha?: string
  telefono?: string
  correo_electronico?: string
  genero?: string
  pais_origen?: string
  pais_residencia?: string
  departamento?: { id: number; nombre: string } | null
  municipio?: { id: number; nombre: string } | null
  direccion_residencia?: string
  programas: ProgramaInscrito[]
  courses: Course[]
  empresa_donde_labora_actualmente?: string
  puesto?: string
  telefono_corporativo?: string | null
  direccion_empresa?: string
  metodo_pago?: string
  monto_inscripcion?: string
  convenio?: Convenio | null
  invoices: any[]
  payments: any[]
  paymentPlans: any[]
  collectionLogs: any[]
  reconciliationRecords: any[]
  documentos: Documento[]
  creator?: { id: number; name: string } | null
}
