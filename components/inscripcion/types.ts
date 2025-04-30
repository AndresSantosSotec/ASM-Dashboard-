// components/inscripcion/types.ts
// -----------------------------------------------------------------------------
// Tipos centrales para TODO el flujo de inscripción.
// ─ Guarda aquí cualquier interfaz que compartan tus pestañas –
//   así mantienes una única fuente de verdad.
// -----------------------------------------------------------------------------

/** Prospecto mostrado en el modal de búsqueda. */
export interface Prospecto {
  id: number
  nombreCompleto: string
  paisOrigen: string
  paisResidencia: string
  telefono: string
  dpi: string
  emailPersonal: string
  emailCorporativo: string
  fechaNacimiento: string
  empresa: string
  puesto: string
  telefonoCorporativo: string
  departamento: string
  estado: string
  fechaRegistro: string
  programaInteres: string
  fuenteCaptura: string
}

  
  /** Formulario – pestaña “Datos Personales”. */
  export interface DatosPersonales {
    nombre: string
    paisOrigen: string
    paisResidencia: string
    telefono: string
    dpi: string
    emailPersonal: string
    emailCorporativo: string
    fechaNacimiento: string        // ISO yyyy‑MM‑dd
    direccion: string
  }
  
  /** Formulario – pestaña “Datos Laborales”. */
  export interface DatosLaborales {
    empresa: string
    puesto: string
    telefonoCorporativo: string
    departamento: string
    sectorEmpresa: string
    direccionEmpresa: string
  }
  
  /** Formulario – pestaña “Información Académica”. */
  export interface DatosAcademicos {
    programa: string;
    duracion: string;  // número de meses como string
    ultimoTitulo: "diversificado" | "tecnico" | "licenciatura" | "maestria" | "doctorado";
    modalidad: "sincronica";
    fechaInicio: string;            // mes en castellano (enero…diciembre)
    diaEstudio: "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado";
    fechaInicioEspecifica: string;  // ISO yyyy-MM-dd
    fechaTallerInduccion: string;   // ISO yyyy-MM-dd
    fechaTallerIntegracion: string; // ISO yyyy-MM-dd
    institucionAnterior: string;
    añoGraduacion: string;
    medioConocio: "redes" | "amigo" | "empresa" | "evento" | "busqueda" | "otros";
    observaciones: string;
    cursosAprobados: string;
  
    // Campos para títulos y sus duraciones
    titulo1: string;
    titulo1_duracion: string;
    titulo2: string;
    titulo2_duracion: string;
    titulo3: string;
    titulo3_duracion: string;
  }
  
  export interface ProgramaConDuracion {
    programaId: number;
    duracion: number;
  }
  
  /** Formulario – pestaña “Datos Financieros”. */
  export interface DatosFinancieros {
    // — propiedades obligatorias iniciales —
    inscripcion:    string;
    cuotaMensual:   string;
    cantidadMeses:  string;
    inversionTotal: string;
  
    // — por cada título, opcionales (los calcula FinancieroTab) —
    inscripcion1?: string;
    cuota1?:       string;
    total1?:       string;
  
    inscripcion2?: string;
    cuota2?:       string;
    total2?:       string;
  
    inscripcion3?: string;
    cuota3?:       string;
    total3?:       string;
  
    // — resto de campos de tu formulario —
    formaPago:      "deposito" | "debito" | "transferencia" | "tarjeta";
    referencia:     "" | "redes" | "amigo" | "empresa" | "evento" | "busqueda" | "otro";
    aceptaTerminos: boolean;
  
    tieneConvenio:  boolean;
    convenioId?:    number;
  }
  
  
  
  
  /** Documento individual para la pestaña “Documentos”. */
  export interface Documento {
    id: string                     // dpi | recibo | american | …
    nombre: string
    descripcion: string
    estado: "pendiente" | "cargado"
    archivo?: File | null
  }
  
  /** Identificadores de las pestañas (útil para el estado global). */
  export type TabId = "personal" | "laboral" | "academico" | "financiero" | "documentos"
  