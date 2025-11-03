import api from "./api"

export type MatriculaDateRange = "all" | "month" | "quarter" | "semester" | "year" | "custom"

export interface MatriculaReportFilters {
  rango?: MatriculaDateRange
  fechaInicio?: string
  fechaFin?: string
  programaId?: string
  tipoAlumno?: string
  page?: number
  perPage?: number
}

export interface MatriculaFilterOption {
  id: string
  nombre: string
}

export interface MatriculaReportFiltersResponse {
  rangosDisponibles?: MatriculaDateRange[]
  programas?: MatriculaFilterOption[]
  tiposAlumno?: string[]
}

export interface MatriculaReportTotals {
  matriculados?: number
  alumnosNuevos?: number
  alumnosRecurrentes?: number
}

export interface MatriculaReportRange {
  fechaInicio?: string
  fechaFin?: string
  descripcion?: string
}

export interface MatriculaDistributionItem {
  programa?: string
  total?: number
  variacion?: number
}

export interface MatriculaEvolutionPoint {
  mes?: string
  total?: number
}

export interface MatriculaTypeDistribution {
  tipo?: string
  total?: number
}

export interface MatriculaPeriodData {
  rango?: MatriculaReportRange
  totales?: MatriculaReportTotals
  distribucionProgramas?: MatriculaDistributionItem[]
  evolucionMensual?: MatriculaEvolutionPoint[]
  distribucionTipo?: MatriculaTypeDistribution[]
}

export interface MatriculaComparativaDetalle {
  actual?: number
  anterior?: number
  variacion?: number
}

export interface MatriculaReportComparativa {
  totales?: MatriculaComparativaDetalle
  nuevos?: MatriculaComparativaDetalle
  recurrentes?: MatriculaComparativaDetalle
}

export interface MatriculaTendencias {
  ultimosDoceMeses?: MatriculaEvolutionPoint[]
  crecimientoPorPrograma?: MatriculaDistributionItem[]
  proyeccion?: { periodo?: string; totalEsperado?: number }[]
}

export interface MatriculaStudentItem {
  id?: number
  nombre?: string
  fechaMatricula?: string
  tipo?: string
  programa?: string
  estado?: string
}

export interface MatriculaPaginationInfo {
  pagina?: number
  porPagina?: number
  total?: number
  totalPaginas?: number
}

export interface MatriculaListado {
  alumnos?: MatriculaStudentItem[]
  paginacion?: MatriculaPaginationInfo
}

export interface MatriculaReportResponse {
  filtros?: MatriculaReportFiltersResponse
  periodoActual?: MatriculaPeriodData
  periodoAnterior?: {
    totales?: MatriculaReportTotals
    rangoComparado?: MatriculaReportRange
  }
  comparativa?: MatriculaReportComparativa
  tendencias?: MatriculaTendencias
  listado?: MatriculaListado
}

export type MatriculaExportFormat = "pdf" | "excel" | "csv"
export type MatriculaExportDetail = "complete" | "summary" | "data"

export interface MatriculaExportPayload {
  formato: MatriculaExportFormat
  detalle?: MatriculaExportDetail
  incluirGraficas?: boolean
  rango?: MatriculaDateRange
  fechaInicio?: string
  fechaFin?: string
  programaId?: string
  tipoAlumno?: string
  page?: number
  perPage?: number
}

const sanitizeFilters = (filters: MatriculaReportFilters) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== "")
  )

export const fetchMatriculaReport = async (
  filters: MatriculaReportFilters
): Promise<MatriculaReportResponse> => {
  const params = sanitizeFilters(filters)
  const response = await api.get("/administracion/reportes-matricula", { params })
  const data = response.data?.data ?? response.data
  return data as MatriculaReportResponse
}

export const exportMatriculaReport = async (payload: MatriculaExportPayload): Promise<void> => {
  const response = await api.post("/administracion/reportes-matricula/exportar", payload, {
    responseType: "blob",
  })

  const contentType = response.headers["content-type"] || "application/octet-stream"
  const blob = new Blob([response.data], { type: contentType })

  if (blob.size === 0) {
    throw new Error("El archivo exportado está vacío")
  }

  const contentDisposition = response.headers["content-disposition"]
  let filename = `reporte_matricula_${new Date().toISOString().replace(/[:]/g, "-")}.${payload.formato}`

  if (typeof contentDisposition === "string") {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, "")
    }
  }

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.style.display = "none"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
