/**
 * Hook para transformar datos crudos de prospectos en formato para tabla
 */

export interface ProspectoRaw {
  id: number
  nombre_completo: string
  correo_electronico: string
  telefono: string
  carnet: string | null
  modalidad: string | null
  dia_estudio: string | null
  fecha_inicio_especifica: string | null
  monto_inscripcion: number | null
  interes: string | null
  created_by: number | null
  asesor_nombre?: string
  // Campos adicionales que pueden venir del backend
  mensualidad?: number | null
  dia_estudio_2?: string | null
  dia_estudio_3?: string | null
  programas?: Array<{
    duracion_meses: number | null
    programa: {
      nombre_del_programa: string
      abreviatura: string
    }
  }>
}

export interface ProspectoTransformado {
  id: number
  carnet: string
  nuevoIngresoReingreso: string
  dia1: string
  dia2: string
  dia3: string
  mesIngreso: string
  inscripcion: number
  montoMensualidad: string
  nombres: string
  apellidos: string
  telefono: string
  email: string
  programa: string
  asesor: string
  // Campos originales para compatibilidad
  nombre_completo: string
  correo_electronico: string
  tiene_carnet: boolean
  datos_completos: boolean
  campos_faltantes: string[]
}

/**
 * Separa nombre completo en nombres y apellidos
 */
function separarNombreCompleto(nombreCompleto: string): { nombres: string; apellidos: string } {
  const partes = nombreCompleto.trim().split(/\s+/)
  if (partes.length === 0) return { nombres: "", apellidos: "" }
  if (partes.length === 1) return { nombres: partes[0], apellidos: "" }
  
  // Primera parte es nombres, el resto son apellidos
  const nombres = partes[0]
  const apellidos = partes.slice(1).join(" ")
  
  return { nombres, apellidos }
}

/**
 * Formatea fecha a nombre del mes en español
 */
function formatearMesIngreso(fecha: string | null): string {
  if (!fecha) return ""
  
  try {
    const date = new Date(fecha)
    return date.toLocaleDateString("es-GT", { month: "long", year: "numeric" })
      .replace(/^\w/, (c) => c.toUpperCase())
  } catch {
    return ""
  }
}

/**
 * Separa días de estudio en hasta 3 columnas
 */
function separarDiasEstudio(diaEstudio: string | null): { dia1: string; dia2: string; dia3: string } {
  if (!diaEstudio) return { dia1: "", dia2: "", dia3: "" }
  
  const dias = diaEstudio.split(",").map(d => d.trim()).filter(Boolean)
  
  return {
    dia1: dias[0] || "",
    dia2: dias[1] || "",
    dia3: dias[2] || "",
  }
}

/**
 * Obtiene el programa del prospecto
 */
function obtenerPrograma(prospecto: ProspectoRaw): string {
  if (prospecto.interes) {
    return prospecto.interes
  }
  
  if (prospecto.programas && prospecto.programas.length > 0) {
    const programa = prospecto.programas[0]
    const abrev = programa.programa?.abreviatura || ""
    const duracion = programa.duracion_meses ? `-${programa.duracion_meses}` : ""
    return `${abrev}${duracion}`
  }
  
  return ""
}

/**
 * Formatea monto de mensualidad
 */
function formatearMensualidad(mensualidad: number | null | undefined): string {
  if (!mensualidad || mensualidad === 0) return ""
  return `Q${mensualidad.toFixed(2)}`
}

/**
 * Transforma un prospecto crudo en formato para tabla
 */
export function transformarProspecto(prospecto: ProspectoRaw): ProspectoTransformado {
  const { nombres, apellidos } = separarNombreCompleto(prospecto.nombre_completo)
  const { dia1, dia2, dia3 } = separarDiasEstudio(prospecto.dia_estudio)
  const mesIngreso = formatearMesIngreso(prospecto.fecha_inicio_especifica)
  const programa = obtenerPrograma(prospecto)
  const montoMensualidad = formatearMensualidad(prospecto.mensualidad)
  
  return {
    id: prospecto.id,
    carnet: prospecto.carnet || "",
    nuevoIngresoReingreso: prospecto.modalidad || "",
    dia1,
    dia2,
    dia3,
    mesIngreso,
    inscripcion: prospecto.monto_inscripcion || 0,
    montoMensualidad,
    nombres,
    apellidos,
    telefono: prospecto.telefono || "",
    email: prospecto.correo_electronico || "",
    programa,
    asesor: prospecto.asesor_nombre || `ID: ${prospecto.created_by || "N/A"}`,
    // Campos originales para compatibilidad
    nombre_completo: prospecto.nombre_completo,
    correo_electronico: prospecto.correo_electronico,
    tiene_carnet: !!prospecto.carnet,
    datos_completos: true, // Se calculará en el backend
    campos_faltantes: [],
  }
}

/**
 * Hook para transformar array de prospectos
 */
export function useProspectosTransform(prospectos: ProspectoRaw[]): ProspectoTransformado[] {
  return prospectos.map(transformarProspecto)
}

