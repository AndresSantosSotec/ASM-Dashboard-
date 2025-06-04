"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Edit, Trash2, BookOpen, Users, Clock, DollarSign, CheckCircle, School, Filter, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle,DialogTrigger,} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { api } from "@/services/api"

interface Programa {
  id: string;
  abreviatura: string;
  nombre_del_programa: string;
  meses: number;
  precios?: {
    inscripcion: number;
    cuota_mensual: number;
    meses: number;
  };
  estado?: 'activo' | 'inactivo';
}

export function ProgramasAcademicos() {
  const [programs, setPrograms] = useState<Programa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("todos")
  const [selectedDuration, setSelectedDuration] = useState<string>("todos")
  const [selectedProgram, setSelectedProgram] = useState<Programa | null>(null)
  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false)
  const [isViewProgramOpen, setIsViewProgramOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showFilters, setShowFilters] = useState(false)
  
  // Estado para nuevo programa
  const [newProgram, setNewProgram] = useState({
    abreviatura: "",
    nombre_del_programa: "",
    meses: 0,
    estado: 'activo',
    precios: {
      inscripcion: 0,
      cuota_mensual: 0,
      meses: 0
    }
  })

  // Cargar programas al montar el componente
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true)
        const response = await api.get('/programas')
        setPrograms(response.data)
        setError(null)
      } catch (err) {
        setError("Error al cargar los programas")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPrograms()
  }, [])

  // Filtrar programas según los filtros aplicados
  const getFilteredPrograms = () => {
    let filtered = programs

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (program) =>
          program.nombre_del_programa.toLowerCase().includes(query) ||
          program.abreviatura.toLowerCase().includes(query)
      )
    }

    // Filtro por estado
    if (selectedStatus !== "todos") {
      filtered = filtered.filter(
        (program) => program.estado === selectedStatus
      )
    }

    // Filtro por duración
    if (selectedDuration !== "todos") {
      const durationRange = selectedDuration.split("-")
      if (durationRange.length === 2) {
        const min = parseInt(durationRange[0])
        const max = parseInt(durationRange[1])
        filtered = filtered.filter(
          (program) => program.meses >= min && program.meses <= max
        )
      } else if (selectedDuration === "12+") {
        filtered = filtered.filter((program) => program.meses >= 12)
      }
    }

    return filtered
  }

  // Paginación
  const filteredPrograms = getFilteredPrograms()
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredPrograms.slice(indexOfFirstItem, indexOfLastItem)

  // Cambiar página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  // Función para agregar un nuevo programa
  const handleAddProgram = async () => {
    try {
      const response = await api.post('/programas', {
        ...newProgram,
        precios: {
          inscripcion: newProgram.precios.inscripcion,
          cuota_mensual: newProgram.precios.cuota_mensual,
          meses: newProgram.meses
        }
      })
      
      setPrograms([...programs, response.data])
      setIsAddProgramOpen(false)
      setNewProgram({
        abreviatura: "",
        nombre_del_programa: "",
        meses: 0,
        estado: 'activo',
        precios: {
          inscripcion: 0,
          cuota_mensual: 0,
          meses: 0
        }
      })
    } catch (err) {
      console.error("Error al crear programa:", err)
      setError("Error al crear el programa")
    }
  }

  // Función para eliminar un programa
  const handleDeleteProgram = async (id: string) => {
    try {
      await api.delete(`/programas/${id}`)
      setPrograms(programs.filter((program) => program.id !== id))
      setIsViewProgramOpen(false)
      // Resetear a la primera página si quedan pocos items
      if (currentItems.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
    } catch (err) {
      console.error("Error al eliminar programa:", err)
      setError("Error al eliminar el programa")
    }
  }

  // Función para editar un programa
  const handleEditProgram = async () => {
    if (!selectedProgram) return
    
    try {
      const response = await api.put(`/programas/${selectedProgram.id}`, {
        ...selectedProgram,
        precios: selectedProgram.precios ? {
          inscripcion: selectedProgram.precios.inscripcion ?? 0,
          cuota_mensual: selectedProgram.precios.cuota_mensual ?? 0,
          meses: selectedProgram.meses
        } : undefined
      })
      
      setPrograms(programs.map((program) => 
        program.id === selectedProgram.id ? response.data : program
      ))
      setIsViewProgramOpen(false)
    } catch (err) {
      console.error("Error al actualizar programa:", err)
      setError("Error al actualizar el programa")
    }
  }

  // Obtener el color de la insignia según el estado
  const getStatusBadge = (estado: string = 'activo') => {
    if (estado === 'activo') {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
          Activo
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
        Inactivo
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Cargando programas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nombre o abreviatura..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1) // Resetear a la primera página al buscar
              }}
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
            
            <Dialog open={isAddProgramOpen} onOpenChange={setIsAddProgramOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setNewProgram({
                      abreviatura: "",
                      nombre_del_programa: "",
                      meses: 0,
                      estado: 'activo',
                      precios: {
                        inscripcion: 0,
                        cuota_mensual: 0,
                        meses: 0
                      }
                    })
                    setIsAddProgramOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Nuevo Programa
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Programa Académico</DialogTitle>
                  <DialogDescription>Complete los detalles del programa para agregarlo al catálogo.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <Label htmlFor="abreviatura">Abreviatura</Label>
                    <Input
                      id="abreviatura"
                      value={newProgram.abreviatura}
                      onChange={(e) => setNewProgram({...newProgram, abreviatura: e.target.value})}
                      maxLength={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre del Programa</Label>
                    <Input
                      id="nombre"
                      value={newProgram.nombre_del_programa}
                      onChange={(e) => setNewProgram({...newProgram, nombre_del_programa: e.target.value})}
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meses">Duración (meses)</Label>
                    <Input
                      id="meses"
                      type="number"
                      value={newProgram.meses || ""}
                      onChange={(e) => setNewProgram({...newProgram, meses: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select
                      value={newProgram.estado}
                      onValueChange={(value) => setNewProgram({...newProgram, estado: value as 'activo' | 'inactivo'})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <h4 className="font-medium">Precios</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="inscripcion">Inscripción</Label>
                      <Input
                        id="inscripcion"
                        type="number"
                        value={newProgram.precios.inscripcion || ""}
                        onChange={(e) => setNewProgram({
                          ...newProgram, 
                          precios: {
                            ...newProgram.precios,
                            inscripcion: parseFloat(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cuota">Cuota Mensual</Label>
                      <Input
                        id="cuota"
                        type="number"
                        value={newProgram.precios.cuota_mensual || ""}
                        onChange={(e) => setNewProgram({
                          ...newProgram, 
                          precios: {
                            ...newProgram.precios,
                            cuota_mensual: parseFloat(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddProgramOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleAddProgram}>
                    Guardar Programa
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Panel de filtros */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => {
                    setSelectedStatus(value)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="activo">Activos</SelectItem>
                    <SelectItem value="inactivo">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Duración (meses)</Label>
                <Select
                  value={selectedDuration}
                  onValueChange={(value) => {
                    setSelectedDuration(value)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por duración" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="1-3">1-3 meses</SelectItem>
                    <SelectItem value="4-6">4-6 meses</SelectItem>
                    <SelectItem value="7-11">7-11 meses</SelectItem>
                    <SelectItem value="12+">12+ meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Items por página</Label>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(parseInt(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Items por página" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="text-sm text-muted-foreground">
        Mostrando {currentItems.length} de {filteredPrograms.length} programas
      </div>

      {filteredPrograms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <School className="mx-auto h-12 w-12 opacity-30 mb-2" />
          <p>No se encontraron programas académicos con los filtros aplicados</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentItems.map((program) => (
              <Card
                key={program.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedProgram(program)
                  setIsViewProgramOpen(true)
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{program.nombre_del_programa}</CardTitle>
                    {getStatusBadge(program.estado)}
                  </div>
                  <CardDescription>{program.abreviatura}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{program.meses} meses</span>
                    </div>
                    {program.precios && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Inscripción: Q{program.precios.inscripcion.toLocaleString()} • 
                          Mensualidad: Q{program.precios.cuota_mensual.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Paginación */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Mostrar páginas cercanas a la actual
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => paginate(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {selectedProgram && (
        <Dialog open={isViewProgramOpen} onOpenChange={setIsViewProgramOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                {selectedProgram.nombre_del_programa}
              </DialogTitle>
              <DialogDescription>
                {selectedProgram.abreviatura} • {selectedProgram.meses} meses
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="edit-abreviatura">Abreviatura</Label>
                <Input
                  id="edit-abreviatura"
                  value={selectedProgram.abreviatura}
                  onChange={(e) => setSelectedProgram({
                    ...selectedProgram, 
                    abreviatura: e.target.value
                  })}
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-nombre">Nombre del Programa</Label>
                <Input
                  id="edit-nombre"
                  value={selectedProgram.nombre_del_programa}
                  onChange={(e) => setSelectedProgram({
                    ...selectedProgram, 
                    nombre_del_programa: e.target.value
                  })}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-meses">Duración (meses)</Label>
                <Input
                  id="edit-meses"
                  type="number"
                  value={selectedProgram.meses || ""}
                  onChange={(e) => setSelectedProgram({
                    ...selectedProgram, 
                    meses: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-estado">Estado</Label>
                <Select
                  value={selectedProgram.estado || 'activo'}
                  onValueChange={(value) => setSelectedProgram({
                    ...selectedProgram,
                    estado: value as 'activo' | 'inactivo'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator className="my-4" />
              
              <h4 className="font-medium">Precios</h4>
              
              {selectedProgram.precios && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-inscripcion">Inscripción</Label>
                    <Input
                      id="edit-inscripcion"
                      type="number"
                      value={selectedProgram.precios.inscripcion || ""}
                      onChange={(e) => setSelectedProgram({
                        ...selectedProgram,
                        precios: {
                          ...selectedProgram.precios,
                          inscripcion: parseFloat(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-cuota">Cuota Mensual</Label>
                    <Input
                      id="edit-cuota"
                      type="number"
                      value={selectedProgram.precios!.cuota_mensual || ""}
                      onChange={(e) => setSelectedProgram({
                        ...selectedProgram,
                        precios: {
                          inscripcion: selectedProgram.precios!.inscripcion,
                          cuota_mensual: parseFloat(e.target.value) || 0,
                          meses: selectedProgram.precios!.meses
                        }
                      })}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex justify-between">
              <Button variant="destructive" onClick={() => handleDeleteProgram(selectedProgram.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setIsViewProgramOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleEditProgram}>
                  <Edit className="mr-2 h-4 w-4" /> Guardar Cambios
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}