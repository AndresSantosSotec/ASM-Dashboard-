import api from "./api"

const getHeaderString = (value: unknown): string | undefined => {
  if (typeof value === "string") return value
  if (Array.isArray(value)) {
    const firstString = value.find((item): item is string => typeof item === "string")
    return firstString
  }
  return undefined
}

// Types for enrolled students API
export interface EstudianteMatriculado {
  id?: number
  nombre?: string
  carnet?: string
  fechaMatricula?: string
  tipo?: string
  tipoAlumno?: string
  programa?: string
  programaId?: number
  estado?: string
  email?: string
}

export interface EstudiantesMatriculadosParams {
  fechaInicio?: string
  fechaFin?: string
  programaId?: string | number
  tipoAlumno?: string
  estado?: string
  page?: number
  perPage?: number
  exportar?: boolean
}

export interface EstudiantesMatriculadosResponse {
  data?: EstudianteMatriculado[]
  estudiantes?: EstudianteMatriculado[]
  alumnos?: EstudianteMatriculado[]
  listado?: {
    alumnos?: EstudianteMatriculado[]
    paginacion?: {
      pagina?: number
      porPagina?: number
      total?: number
      totalPaginas?: number
    }
  }
  paginacion?: {
    pagina?: number
    porPagina?: number
    total?: number
    totalPaginas?: number
  }
  pagination?: {
    current_page?: number
    per_page?: number
    total?: number
    last_page?: number
  }
  total?: number
  filtros?: {
    programas?: Array<{ id: string | number; nombre: string }>
    tiposAlumno?: string[]
    estados?: string[]
  }
}

export interface ExportarEstudiantesPayload {
  formato: "pdf" | "excel" | "csv"
  fechaInicio?: string
  fechaFin?: string
  programaId?: string | number
  tipoAlumno?: string
  estado?: string
  incluirTodos?: boolean
}

/**
 * Fetch all enrolled students with optional filters
 * GET /api/administracion/estudiantes-matriculados
 */
export const fetchEstudiantesMatriculados = async (
  params?: EstudiantesMatriculadosParams
): Promise<EstudiantesMatriculadosResponse> => {
  const response = await api.get("/administracion/estudiantes-matriculados", {
    params,
  })
  
  // Handle different response structures
  const data = response.data?.data ?? response.data
  
  // Normalize response format
  return {
    data: data.data ?? data.estudiantes ?? data,
    estudiantes: data.data ?? data.estudiantes ?? data,
    paginacion: data.paginacion ?? {
      pagina: data.pagination?.current_page ?? params?.page ?? 1,
      porPagina: data.pagination?.per_page ?? params?.perPage ?? 50,
      total: data.pagination?.total ?? data.total ?? (Array.isArray(data) ? data.length : 0),
      totalPaginas: data.pagination?.last_page ?? Math.ceil((data.total ?? 0) / (params?.perPage ?? 50)),
    },
    total: data.total ?? data.pagination?.total,
    filtros: data.filtros,
  } as EstudiantesMatriculadosResponse
}

/**
 * Export enrolled students data to PDF, Excel, or CSV
 * POST /api/administracion/estudiantes-matriculados/exportar
 */
export const exportarEstudiantesMatriculados = async (
  payload: ExportarEstudiantesPayload
): Promise<void> => {
  try {
    const response = await api.post(
      "/administracion/estudiantes-matriculados/exportar",
      payload,
      {
        responseType: "blob",
      }
    )

    // Create blob from response
    const contentType =
      getHeaderString(response.headers["content-type"]) || "application/octet-stream"
    const blob = new Blob([response.data], { type: contentType })

    // Verify blob has content
    if (blob.size === 0) {
      throw new Error("El archivo exportado está vacío")
    }

    // Get filename from headers or use default
    const contentDisposition = getHeaderString(response.headers["content-disposition"])
    let filename = `estudiantes_matriculados_${new Date().toISOString().split("T")[0]}.${payload.formato}`

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      )
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "")
      }
    }

    // Create download link and trigger download
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.style.display = "none"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error exporting enrolled students:", error)
    throw error
  }
}
