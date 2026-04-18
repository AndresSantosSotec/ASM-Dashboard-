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
  direccion?: string;
  empresa: string;
  puesto: string;
  telefonoCorporativo: string;
  departamento: string;
  direccionEmpresa?: string;
  estado: string;
  fechaRegistro?: string;
  programaInteres: string;
  fuenteCaptura?: string;
  // Datos académicos del prospecto
  ultimoTitulo?: string;
  institucionTitulo?: string;
  anioGraduacion?: string;
  modalidad?: string;
  fechaInicioEspecifica?: string;
  fechaTallerReduccion?: string;
  fechaTallerIntegracion?: string;
  medioConocimiento?: string;
  medioConocio?: string;
  cursosAprobados?: string;
  diaEstudio?: string;
  observaciones?: string;
  notasGenerales?: string;
  // Datos financieros
  metodoPago?: string;
  montoInscripcion?: string;
  convenioId?: number | null;
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
  esReinscripcion?: boolean;
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
  ultimoTitulo: "diversificado" | "tecnico" | "licenciatura" | "maestria" | "doctorado" | "cierre_pensum";
  modalidad: "sincronica";
  fechaInicio: string;
  diaEstudio: string;
  fechaInicioEspecifica: string;
  fechaTallerInduccion: string;
  fechaTallerIntegracion: string;
  institucionAnterior: string;
  añoGraduacion: string;
  carrera?: string;
  medioConocio: "facebook" | "instagram" | "linkedin" | "referido" | "whatsapp_corporativo" | "pagina_web" | "actividades_escritorio" | "meeting" | "otros" | "";
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
  moneda: "GTQ" | "USD";  // 💱 Moneda del estudiante. GTQ por defecto. Tasa fija 8 GTQ/USD.
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
  /** Nombre del convenio asociado, si aplica */
  convenioNombre?: string;
  /** Indica si la inscripción tiene descuento (monto < estándar Q1,000) */
  descuentoInscripcion?: boolean;
  /** Indica que la inscripción fue Q0 (exonerada/cortesía): importante para tracking contable */
  inscripcionCero?: boolean;
}

export interface Documento {
  id: string;
  nombre: string;
  descripcion: string;
  estado: "pendiente" | "cargado";
  archivos: File[];
  optional?: boolean;
  /** URL para descarga del documento */
  url?: string;
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