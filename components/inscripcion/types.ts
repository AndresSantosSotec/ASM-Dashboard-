export interface Prospecto {
  id: number;
  nombreCompleto: string;
  paisOrigen: string;
  paisResidencia: string;
  telefono: string;
  dpi: string;
  emailPersonal: string;
  emailCorporativo: string;
  fechaNacimiento: string;
  empresa: string;
  puesto: string;
  telefonoCorporativo: string;
  departamento: string;
  estado: string;
  fechaRegistro: string;
  programaInteres: string;
  fuenteCaptura: string;
}

export interface DatosPersonales {
  nombre: string;
  paisOrigen: string;
  paisResidencia: string;
  telefono: string;
  dpi: string;
  emailPersonal: string;
  emailCorporativo: string;
  fechaNacimiento: string; // ISO: "yyyy-MM-dd"
  direccion: string;
}

export interface DatosLaborales {
  empresa: string;
  puesto: string;
  telefonoCorporativo: string;
  departamento: string;
  sectorEmpresa: string;
  direccionEmpresa: string;
}

export interface DatosAcademicos {
  programa: string;
  duracion: string;
  ultimoTitulo: "diversificado" | "tecnico" | "licenciatura" | "maestria" | "doctorado";
  modalidad: "sincronica";
  fechaInicio: string;
  diaEstudio: "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado";
  fechaInicioEspecifica: string;
  fechaTallerInduccion: string;
  fechaTallerIntegracion: string;
  institucionAnterior: string;
  añoGraduacion: string;
  medioConocio: "redes" | "amigo" | "empresa" | "evento" | "busqueda" | "otros";
  observaciones: string;
  cursosAprobados: string;
  titulo1: string;
  titulo1_duracion: string;
  titulo2: string;
  titulo2_duracion: string;
  titulo3: string;
  titulo3_duracion: string;
}

export interface DatosFinancieros {
  inscripcion: string;
  cuotaMensual: string;
  cantidadMeses: string;
  inversionTotal: string;
  inscripcion1?: string;
  cuota1?: string;
  total1?: string;
  inscripcion2?: string;
  cuota2?: string;
  total2?: string;
  inscripcion3?: string;
  cuota3?: string;
  total3?: string;
  formaPago: "deposito" | "debito" | "transferencia" | "tarjeta";
  referencia: "" | "redes" | "amigo" | "empresa" | "evento" | "busqueda" | "otro";
  aceptaTerminos: boolean;
  tieneConvenio: boolean;
  convenioId?: number;
}

export interface Documento {
  id: string;
  nombre: string;
  descripcion: string;
  estado: "pendiente" | "cargado";
  archivo?: File | null;
}

/** Ficha de inscripción del estudiante */
export type FichaEstudiante = {
  id: number;
  nombre: string;
  telefono: string;
  correo: string;
  departamento: string;
  programa: string;
  cantidadProgramas: number;
  estado: string;
  prioridad: "alta" | "media" | "baja";
  fecha: string;
  ultimaActualizacion: string;
  // Propiedades agregadas para solucionar los errores:
  camposIncompletos?: string[];
  observaciones?: string;
  prospecto: Prospecto;
  datosPersonales: DatosPersonales;
  datosLaborales: DatosLaborales;
  datosAcademicos: DatosAcademicos;
  datosFinancieros: DatosFinancieros;
  documentos?: Documento[];
};

// Se agregan los siguientes tipos para su utilización en RegistrationForm:

export type TabId = "personal" | "laboral" | "academico" | "financiero" | "documentos";

export interface ProgramaConDuracion {
  programaId: number;
  duracion: number;
}