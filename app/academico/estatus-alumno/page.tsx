"use client"

import { useState, useEffect } from "react"
import { Eye, AlertTriangle, Search, Download, FileSpreadsheet, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import api from "@/services/api"
import { exportToCSV, exportToExcel } from "@/lib/excel-exporter"
import { ExportProgressModal } from "@/components/ui/export-progress-modal"

interface StudentWithProgress {
  id: string
  nombre_completo: string
  carnet: string
  correo_electronico: string
  programa: string
  cursos_aprobados?: number | null
  cursos_reprobados?: number | null
  cursos_en_progreso?: number | null
  total_cursos?: number | null
  promedio?: number | null
  creditos_completados?: number | null
  creditos_totales?: number | null
  estado: string
}

export default function EstatusAcademico() {
  const [students, setStudents] = useState<StudentWithProgress[]>([])
  const [filteredStudents, setFilteredStudents] = useState<StudentWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalStudents, setTotalStudents] = useState(0)
  
  // Filtros
  const [selectedProgram, setSelectedProgram] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [programs, setPrograms] = useState<string[]>([])
  const [statuses, setStatuses] = useState<string[]>([])

  // Estados para modal de exportación
  const [exportModal, setExportModal] = useState({
    isOpen: false,
    currentProgress: 0,
    totalItems: 0,
    currentPage: 0,
    totalPages: 0,
    status: 'loading' as 'loading' | 'success' | 'error',
    errorMessage: ''
  })

  // Cargar todos los estudiantes al iniciar
  useEffect(() => {
    loadAllStudents()
  }, [])

  // Filtrar estudiantes cuando cambia cualquier filtro
  useEffect(() => {
    let filtered = students

    // Filtro por texto de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(student =>
        student.nombre_completo.toLowerCase().includes(term) ||
        student.carnet.toLowerCase().includes(term) ||
        student.correo_electronico.toLowerCase().includes(term) ||
        student.programa.toLowerCase().includes(term)
      )
    }

    // Filtro por programa
    if (selectedProgram !== "all") {
      filtered = filtered.filter(student => student.programa === selectedProgram)
    }

    // Filtro por estado
    if (selectedStatus !== "all") {
      filtered = filtered.filter(student => student.estado === selectedStatus)
    }

    setFilteredStudents(filtered)
    // Resetear a página 1 cuando cambia cualquier filtro
    setCurrentPage(1)
  }, [searchTerm, selectedProgram, selectedStatus, students])

  const loadAllStudents = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('[ESTATUS ALUMNO] Cargando lista completa de estudiantes...')

      // Obtener todos los estudiantes con sus estadísticas académicas
      const response = await api.get('/estudiantes/lista-completa')
      
      console.log('[ESTATUS ALUMNO] Respuesta recibida:', {
        status: response.status,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : 0,
        firstItem: Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : null
      })
      
      if (response.data && Array.isArray(response.data)) {
        const studentsData: StudentWithProgress[] = response.data.map((student: any) => ({
          id: student.id || '',
          nombre_completo: student.nombre_completo || 'Sin nombre',
          carnet: student.carnet || 'Sin carnet',
          correo_electronico: student.correo_electronico || '',
          programa: student.programa_nombre || 'Sin programa',
          cursos_aprobados: student.cursos_aprobados,
          cursos_reprobados: student.cursos_reprobados,
          cursos_en_progreso: student.cursos_en_progreso,
          total_cursos: student.total_cursos,
          promedio: student.promedio,
          creditos_completados: student.creditos_completados,
          creditos_totales: student.creditos_totales,
          estado: student.estado || 'Activo'
        }))
        
        console.log('[ESTATUS ALUMNO] Estudiantes procesados:', studentsData.length)
        
        setStudents(studentsData)
        setFilteredStudents(studentsData)
        setTotalStudents(studentsData.length)
        
        // Extraer programas y estados únicos
        const uniquePrograms = Array.from(new Set(studentsData.map(s => s.programa))).sort()
        const uniqueStatuses = Array.from(new Set(studentsData.map(s => s.estado))).sort()
        setPrograms(uniquePrograms)
        setStatuses(uniqueStatuses)
        
        if (studentsData.length === 0) {
          toast({
            title: "Sin datos",
            description: "No se encontraron estudiantes inscritos con carnet asignado",
            variant: "default"
          })
        } else {
          toast({
            title: "Datos cargados",
            description: `Se cargaron ${studentsData.length} estudiantes correctamente`,
          })
        }
      } else {
        console.warn('[ESTATUS ALUMNO] Respuesta no es un array:', response.data)
        toast({
          title: "Advertencia",
          description: "La respuesta del servidor no tiene el formato esperado",
          variant: "default"
        })
      }

    } catch (err: any) {
      console.error('[ESTATUS ALUMNO] Error al cargar estudiantes:', err)
      console.error('[ESTATUS ALUMNO] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      })
      
      setError(err.response?.data?.message || 'Error al cargar la lista de estudiantes')
      toast({
        title: "Error",
        description: err.response?.data?.message || "No se pudieron cargar los estudiantes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (studentId: string) => {
    // Navegar a vista detallada del estudiante
    window.location.href = `/academico/estatus-alumno/${studentId}`
  }

  /**
   * ✅ NUEVO: Generar reporte en segundo plano (no bloquea interfaz)
   */
  const handleReporteMasivoAsync = async (formato: 'excel' | 'csv') => {
    if (filteredStudents.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay estudiantes para exportar",
        variant: "default"
      })
      return
    }

    try {
      // Construir filtros
      const body: any = { formato }
      if (searchTerm) body.search = searchTerm
      if (selectedProgram !== 'all') body.programa = selectedProgram
      if (selectedStatus !== 'all') body.estado = selectedStatus

      const response = await api.post('/estudiantes/reportes/solicitar', body)

      if (response.data.success) {
        toast({
          title: "✅ Reporte en proceso",
          description: `El reporte se está generando en segundo plano. Recibirás un email en ${response.data.email} cuando esté listo. Puedes continuar navegando.`,
          variant: "default",
          duration: 7000
        })
      } else {
        throw new Error(response.data.message || 'Error al solicitar reporte')
      }
    } catch (error: any) {
      console.error('[REPORTE MASIVO] Error:', error)
      toast({
        title: "Error",
        description: error?.response?.data?.message || 'No se pudo solicitar el reporte',
        variant: "destructive"
      })
    }
  }

  const handleExportCSV = async () => {
    if (filteredStudents.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay estudiantes para exportar",
        variant: "default"
      })
      return
    }

    try {
      // ✅ Abrir modal de progreso
      setExportModal({
        isOpen: true,
        currentProgress: 0,
        totalItems: 0,
        currentPage: 0,
        totalPages: 0,
        status: 'loading',
        errorMessage: ''
      })

      // ✅ Obtener datos por chunks con barra de progreso
      const todosEstudiantes = await obtenerDatosParaReporte('csv')
      
      if (todosEstudiantes.length === 0) {
        setExportModal(prev => ({ ...prev, status: 'error', errorMessage: 'No se obtuvieron datos para el reporte' }))
        setTimeout(() => setExportModal(prev => ({ ...prev, isOpen: false })), 3000)
        return
      }

      // ✅ Exportar archivo
      exportToCSV(todosEstudiantes)
      
      // ✅ Mostrar éxito
      setExportModal(prev => ({ ...prev, status: 'success', totalItems: todosEstudiantes.length }))
      setTimeout(() => setExportModal(prev => ({ ...prev, isOpen: false })), 2000)

    } catch (error: any) {
      console.error('[EXPORT] Error al exportar CSV:', error)
      setExportModal(prev => ({ 
        ...prev, 
        status: 'error', 
        errorMessage: error?.message || 'No se pudo exportar el archivo CSV'
      }))
      setTimeout(() => setExportModal(prev => ({ ...prev, isOpen: false })), 3000)
    }
  }

  const handleExportExcel = async () => {
    if (filteredStudents.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay estudiantes para exportar",
        variant: "default"
      })
      return
    }

    try {
      // ✅ Abrir modal de progreso
      setExportModal({
        isOpen: true,
        currentProgress: 0,
        totalItems: 0,
        currentPage: 0,
        totalPages: 0,
        status: 'loading',
        errorMessage: ''
      })

      // ✅ Obtener datos por chunks con barra de progreso
      const todosEstudiantes = await obtenerDatosParaReporte('excel')
      
      if (todosEstudiantes.length === 0) {
        setExportModal(prev => ({ ...prev, status: 'error', errorMessage: 'No se obtuvieron datos para el reporte' }))
        setTimeout(() => setExportModal(prev => ({ ...prev, isOpen: false })), 3000)
        return
      }

      // ✅ Exportar archivo
      exportToExcel(todosEstudiantes)
      
      // ✅ Mostrar éxito
      setExportModal(prev => ({ ...prev, status: 'success', totalItems: todosEstudiantes.length }))
      setTimeout(() => setExportModal(prev => ({ ...prev, isOpen: false })), 2000)

    } catch (error: any) {
      console.error('[EXPORT] Error al exportar Excel:', error)
      setExportModal(prev => ({ 
        ...prev, 
        status: 'error', 
        errorMessage: error?.message || 'No se pudo exportar el archivo Excel'
      }))
      setTimeout(() => setExportModal(prev => ({ ...prev, isOpen: false })), 3000)
    }
  }

  /**
   * ⚡ ULTRA-RÁPIDO: Obtener datos académicos por chunks (100 en 100)
   * Con precalentamiento de cache opcional
   */
  const obtenerDatosParaReporte = async (exportType: 'csv' | 'excel'): Promise<any[]> => {
    const PER_PAGE = 100 // ⚡ Chunks de 100 estudiantes (2x más rápido)
    let page = 1
    let hasMore = true
    let todosEstudiantes: any[] = []

    // Construir parámetros de filtro
    const params = new URLSearchParams({
      per_page: PER_PAGE.toString(),
      ...(searchTerm && { search: searchTerm }),
      ...(selectedProgram !== 'all' && { programa: selectedProgram }),
      ...(selectedStatus !== 'all' && { estado: selectedStatus })
    })

    try {
      // ⚡ PASO 1: Precalentar cache si hay muchos estudiantes
      const totalEstimado = filteredStudents.length
      
      if (totalEstimado > 100) {
        setExportModal(prev => ({
          ...prev,
          currentProgress: 0,
          totalItems: totalEstimado,
          currentPage: 0,
          totalPages: Math.ceil(totalEstimado / PER_PAGE),
          status: 'loading'
        }))

        // Precalentar cache en background
        try {
          const precalentarParams = new URLSearchParams({
            ...(searchTerm && { search: searchTerm }),
            ...(selectedProgram !== 'all' && { programa: selectedProgram }),
            ...(selectedStatus !== 'all' && { estado: selectedStatus }),
            limit: '500'
          })

          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/estudiantes/precalentar-cache?${precalentarParams}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            }
          )
        } catch (e) {
          console.warn('[PRECALENTAR] Error, continuando sin precalentar:', e)
        }
      }

      // ⚡ PASO 2: Obtener datos por chunks (ahora super rápido por el cache)
      while (hasMore) {
        params.set('page', page.toString())

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/estudiantes/lista-reporte?${params}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!response.ok) throw new Error('Error al obtener chunk de datos')

        const result = await response.json()
        const chunk = result.data || []
        const pagination = result.pagination

        todosEstudiantes = [...todosEstudiantes, ...chunk]

        // ✅ Actualizar modal de progreso
        if (pagination) {
          setExportModal(prev => ({
            ...prev,
            currentProgress: todosEstudiantes.length,
            totalItems: pagination.total,
            currentPage: page,
            totalPages: pagination.total_pages,
            status: 'loading'
          }))

          hasMore = pagination.has_more
          page++
        } else {
          hasMore = false
        }

        // ⚡ Sin pausa - Máxima velocidad de procesamiento
      }

      return todosEstudiantes

    } catch (error) {
      console.error('[REPORTE] Error obteniendo chunks:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500">Cargando estudiantes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar información</h3>
            <p className="text-red-600 mb-6 text-center">{error}</p>
            <div className="flex gap-4">
              <Button onClick={loadAllStudents} variant="default">
                Reintentar
              </Button>
              <Button onClick={() => window.location.href = '/login'} variant="outline">
                Ir a Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      {/* ✅ Modal de progreso de exportación */}
      <ExportProgressModal
        isOpen={exportModal.isOpen}
        currentProgress={exportModal.currentProgress}
        totalItems={exportModal.totalItems}
        currentPage={exportModal.currentPage}
        totalPages={exportModal.totalPages}
        status={exportModal.status}
        errorMessage={exportModal.errorMessage}
      />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Estatus Académico de Estudiantes</h1>
          <p className="text-gray-500 mt-1">
            {filteredStudents.length} de {students.length} estudiantes
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* ✅ NUEVO: Botón para generación en segundo plano */}
          {/* <Button 
            onClick={() => handleReporteMasivoAsync('excel')} 
            variant="default"
            className="bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            disabled={filteredStudents.length === 0}
          >
            <Clock className="mr-2 h-4 w-4" />
            Generar en Background
          </Button> */}
          
          <Button 
            onClick={handleExportExcel} 
            variant="outline"
            className="hover:bg-green-50 hover:border-green-500 hover:text-green-700 transition-colors"
            disabled={filteredStudents.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button 
            onClick={handleExportCSV} 
            variant="outline"
            className="hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700 transition-colors"
            disabled={filteredStudents.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button onClick={loadAllStudents} variant="outline">
            Actualizar
          </Button>
        </div>
      </div>

      {/* Búsqueda y Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Búsqueda por texto */}
            <div className="flex gap-4 items-center">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, carnet, correo o programa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            
            {/* Filtros adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro por programa */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Programa Académico
                </label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los programas ({totalStudents})</option>
                  {programs.map(programa => (
                    <option key={programa} value={programa}>
                      {programa} ({students.filter(s => s.programa === programa).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por estado */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Estado
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los estados ({totalStudents})</option>
                  {statuses.map(estado => (
                    <option key={estado} value={estado}>
                      {estado} ({students.filter(s => s.estado === estado).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Botón limpiar filtros */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedProgram("all")
                    setSelectedStatus("all")
                    setCurrentPage(1)
                  }}
                  className="w-full"
                  disabled={searchTerm === "" && selectedProgram === "all" && selectedStatus === "all"}
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>

            {/* Indicador de filtros activos */}
            {(searchTerm || selectedProgram !== "all" || selectedStatus !== "all") && (
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded">
                <span className="font-medium">Filtros activos:</span>
                {searchTerm && <Badge variant="outline">Búsqueda: "{searchTerm}"</Badge>}
                {selectedProgram !== "all" && <Badge variant="outline">Programa: {selectedProgram}</Badge>}
                {selectedStatus !== "all" && <Badge variant="outline">Estado: {selectedStatus}</Badge>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controles de paginación */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Mostrar:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">registros por página</span>
            </div>
            <div className="text-sm text-gray-600">
              Mostrando {filteredStudents.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredStudents.length)} de {filteredStudents.length} registros
              {searchTerm && ` (filtrados de ${totalStudents} totales)`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de estudiantes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Estudiantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Carnet</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Programa</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No se encontraron estudiantes con ese criterio' : 'No hay estudiantes registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((student, index) => (
                    <TableRow key={`${student.carnet}-${student.id}-${index}`} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium">{student.nombre_completo}</div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{student.carnet}</code>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">{student.correo_electronico}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{student.programa}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={student.estado === 'Activo' || student.estado === 'Inscrito' ? 'default' : 'secondary'}>
                          {student.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleViewDetails(student.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalle Completo
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Navegación de paginación */}
      {filteredStudents.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                ← Anterior
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.ceil(filteredStudents.length / itemsPerPage) }, (_, i) => i + 1)
                  .filter(page => {
                    // Mostrar primeras 2, últimas 2, y 2 alrededor de la página actual
                    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
                    return (
                      page === 1 ||
                      page === 2 ||
                      page === totalPages ||
                      page === totalPages - 1 ||
                      Math.abs(page - currentPage) <= 1
                    )
                  })
                  .map((page, index, array) => {
                    // Agregar puntos suspensivos si hay saltos
                    const prevPage = array[index - 1]
                    const showEllipsis = prevPage && page - prevPage > 1
                    
                    return (
                      <div key={page} className="flex items-center gap-2">
                        {showEllipsis && <span className="text-gray-400">...</span>}
                        <Button
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="min-w-[40px]"
                        >
                          {page}
                        </Button>
                      </div>
                    )
                  })}
              </div>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredStudents.length / itemsPerPage), prev + 1))}
                disabled={currentPage >= Math.ceil(filteredStudents.length / itemsPerPage)}
              >
                Siguiente →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

