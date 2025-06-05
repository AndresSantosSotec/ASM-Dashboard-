"use client"

import { useState, useEffect} from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Search, CheckCircle2, XCircle, Filter, FileSpreadsheet, AlertTriangle, Calendar, Download, Send,} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle,DialogTrigger,} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import axios from "axios"
import { API_BASE_URL } from "@/utils/apiConfig"

type FichaEstudiante = {
  id: number
  nombre: string
  telefono: string
  correo: string
  departamento: string
  programa: string
  cantidadProgramas: number
  estado: string
  prioridad?: "alta" | "media" | "baja"  // opcional por ahora
  fecha?: string                        // opcional si no viene aún
  ultimaActualizacion?: string         // opcional si no viene aún
  observaciones?: string
  camposIncompletos?: string[]
}


const [fichas, setFichas] = useState<FichaEstudiante[]>([])

useEffect(() => {
  const fetchFichas = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/fichas/pendientes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const json = await res.json()
      const mapped = json.data.map((item: any) => ({
        id: item.id,
        nombre: item.nombre_completo,
        telefono: item.telefono,
        correo: item.correo_electronico,
        departamento: item.departamento,
        programa: item.nombre_programa,
        cantidadProgramas: item.cantidad_programas,
        estado: item.status,
        prioridad: "media", // Default temporal
        fecha: "01/01/2024", // Simulación
        ultimaActualizacion: "01/01/2024", // Simulación
        observaciones: "",
        camposIncompletos: [],
      }))
      setFichas(mapped)
    } catch (err) {
      console.error("Error al cargar fichas pendientes", err)
    }
  }

  fetchFichas()
}, [])



export function GestionFichas() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFicha, setSelectedFicha] = useState<FichaEstudiante | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("todas")
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("todos")
  const [comentarioRevision, setComentarioRevision] = useState("")
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [camposValidados, setCamposValidados] = useState<Record<string, boolean>>({})



  const filteredFichas = fichas.filter((ficha) => {
    // Filtro por término de búsqueda
    const matchesSearch =
      ficha.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ficha.programa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ficha.id.toString().toLowerCase().includes(searchTerm.toLowerCase())

    // Filtro por estado
    const matchesEstado = filtroEstado === "todos" || ficha.estado === filtroEstado

    // Filtro por prioridad
    const matchesPrioridad = filtroPrioridad === "todas" || ficha.prioridad === filtroPrioridad

    // Filtro por período (simulado)
    const matchesPeriodo = filtroPeriodo === "todos" || true

    return matchesSearch && matchesEstado && matchesPrioridad && matchesPeriodo
  })

  const handleMarcarRevisada = () => {
    if (selectedFicha) {
      // Aquí iría la lógica para actualizar el estado en la base de datos
      setShowSuccessMessage(true)
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000)
    }
  }

  const handleSolicitarCorreccion = () => {
    if (selectedFicha && comentarioRevision.trim() !== "") {
      // Aquí iría la lógica para enviar la solicitud de corrección
      setShowSuccessMessage(true)
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000)
    }
  }

  const handleToggleValidacion = (campo: string, valor: boolean) => {
    setCamposValidados({
      ...camposValidados,
      [campo]: valor,
    })
  }

  const getBadgeForEstado = (estado: string) => {
    switch (estado) {
      case "completa":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-100">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Completa
          </Badge>
        )
      case "incompleta":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-100">
            <XCircle className="mr-1 h-3 w-3" /> Incompleta
          </Badge>
        )
      case "revisada":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-100">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Revisada
          </Badge>
        )
      case "correccion_solicitada":
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/40 dark:text-orange-100">
            <AlertTriangle className="mr-1 h-3 w-3" /> Corrección Solicitada
          </Badge>
        )
      default:
        return null
    }
  }

  const getBadgeForPrioridad = (prioridad: string) => {
    switch (prioridad) {
      case "alta":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-200">Alta</Badge>
        )
      case "media":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-200">
            Media
          </Badge>
        )
      case "baja":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200">
            Baja
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Fichas y Datos</h1>
          <p className="text-muted-foreground">Administre y valide las fichas de inscripción.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Filter className="h-4 w-4" />
            <span>Filtrar</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Exportar</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Download className="h-4 w-4" />
            <span>Descargar</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 flex-1">
          <div>
            <Label>Estado</Label>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="completa">Completas</SelectItem>
                <SelectItem value="incompleta">Incompletas</SelectItem>
                <SelectItem value="revisada">Revisadas</SelectItem>
                <SelectItem value="correccion_solicitada">Corrección Solicitada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Prioridad</Label>
            <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Período</Label>
            <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ultimo-mes">Último mes</SelectItem>
                <SelectItem value="ultimo-trimestre">Último trimestre</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Programa</Label>
            <Select defaultValue="todos">
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ingenieria">Ingeniería</SelectItem>
                <SelectItem value="administracion">Administración</SelectItem>
                <SelectItem value="contabilidad">Contabilidad</SelectItem>
                <SelectItem value="derecho">Derecho</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre, programa..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Listado de Fichas</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                <Calendar className="mr-1 h-3 w-3" /> Actualizado: Hoy, 10:30 AM
              </Badge>
            </div>
          </div>
          <CardDescription>Visualice y audite la información ingresada por los estudiantes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Programa</TableHead>
                <TableHead className="hidden md:table-cell">Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden lg:table-cell">Prioridad</TableHead>
                <TableHead className="hidden lg:table-cell">Última Actualización</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFichas.map((ficha) => (
                <TableRow key={ficha.id}>
                  <TableCell>{ficha.id}</TableCell>
                  <TableCell>{ficha.nombre}</TableCell>
                  <TableCell className="hidden md:table-cell">{ficha.programa}</TableCell>
                  <TableCell className="hidden md:table-cell">{ficha.fecha}</TableCell>
                  <TableCell>{getBadgeForEstado(ficha.estado)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{getBadgeForPrioridad(ficha.prioridad)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{ficha.ultimaActualizacion}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelectedFicha(ficha)}>
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Ficha de Inscripción - {ficha.id}</DialogTitle>
                          <DialogDescription>Detalles de la ficha de inscripción de {ficha.nombre}</DialogDescription>
                        </DialogHeader>
                        <Tabs defaultValue="personales" className="mt-4">
                          <TabsList className="grid grid-cols-4">
                            <TabsTrigger value="personales">Datos Personales</TabsTrigger>
                            <TabsTrigger value="academicos">Datos Académicos</TabsTrigger>
                            <TabsTrigger value="laborales">Datos Laborales</TabsTrigger>
                            <TabsTrigger value="financieros">Datos Financieros</TabsTrigger>
                          </TabsList>
                          <TabsContent value="personales" className="p-4 border rounded-md mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Nombre Completo</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["nombre"] || false}
                                            onCheckedChange={(checked) => handleToggleValidacion("nombre", checked)}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value={ficha.nombre} readOnly />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Documento de Identidad</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["documento"] || false}
                                            onCheckedChange={(checked) => handleToggleValidacion("documento", checked)}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value="12345678" readOnly />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Dirección</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["direccion"] || false}
                                            onCheckedChange={(checked) => handleToggleValidacion("direccion", checked)}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value="Calle Principal #123" readOnly />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Teléfono</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["telefono"] || false}
                                            onCheckedChange={(checked) => handleToggleValidacion("telefono", checked)}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value="+123 456 7890" readOnly />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Correo Electrónico</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["correo"] || false}
                                            onCheckedChange={(checked) => handleToggleValidacion("correo", checked)}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value="correo@ejemplo.com" readOnly />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Fecha de Nacimiento</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["fecha_nacimiento"] || false}
                                            onCheckedChange={(checked) =>
                                              handleToggleValidacion("fecha_nacimiento", checked)
                                            }
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value="15/01/1990" readOnly />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Nacionalidad</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["nacionalidad"] || false}
                                            onCheckedChange={(checked) =>
                                              handleToggleValidacion("nacionalidad", checked)
                                            }
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value="Guatemalteca" readOnly />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Estado Civil</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["estado_civil"] || false}
                                            onCheckedChange={(checked) =>
                                              handleToggleValidacion("estado_civil", checked)
                                            }
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value="Soltero" readOnly />
                              </div>
                            </div>
                          </TabsContent>
                          <TabsContent value="academicos" className="p-4 border rounded-md mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Programa Seleccionado</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["programa"] || false}
                                            onCheckedChange={(checked) => handleToggleValidacion("programa", checked)}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value={ficha.programa} readOnly />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Institución Anterior</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["institucion_anterior"] || false}
                                            onCheckedChange={(checked) =>
                                              handleToggleValidacion("institucion_anterior", checked)
                                            }
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input
                                  value="Universidad Nacional"
                                  readOnly
                                  className={
                                    ficha.camposIncompletos?.includes("historial_academico") ? "border-red-500" : ""
                                  }
                                />
                                {ficha.camposIncompletos?.includes("historial_academico") && (
                                  <p className="text-xs text-red-500">Información pendiente de verificación</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Título Obtenido</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["titulo"] || false}
                                            onCheckedChange={(checked) => handleToggleValidacion("titulo", checked)}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input
                                  value="Bachiller en Ciencias"
                                  readOnly
                                  className={ficha.camposIncompletos?.includes("titulo_previo") ? "border-red-500" : ""}
                                />
                                {ficha.camposIncompletos?.includes("titulo_previo") && (
                                  <p className="text-xs text-red-500">Información pendiente de verificación</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Año de Graduación</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["graduacion"] || false}
                                            onCheckedChange={(checked) => handleToggleValidacion("graduacion", checked)}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value="2018" readOnly />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Promedio Académico</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["promedio"] || false}
                                            onCheckedChange={(checked) => handleToggleValidacion("promedio", checked)}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value="85/100" readOnly />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Documentos Académicos</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["documentos_academicos"] || false}
                                            onCheckedChange={(checked) =>
                                              handleToggleValidacion("documentos_academicos", checked)
                                            }
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <span>Documentos cargados (3)</span>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          <TabsContent value="laborales" className="p-4 border rounded-md mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Empresa Actual</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["empresa"] || false}
                                            onCheckedChange={(checked) => handleToggleValidacion("empresa", checked)}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value="Empresa ABC" readOnly />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Cargo</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["cargo"] || false}
                                            onCheckedChange={(checked) => handleToggleValidacion("cargo", checked)}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value="Analista Sénior" readOnly />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Dirección Laboral</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["direccion_laboral"] || false}
                                            onCheckedChange={(checked) =>
                                              handleToggleValidacion("direccion_laboral", checked)
                                            }
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input
                                  value={
                                    ficha.estado === "incompleta" && ficha.observaciones?.includes("dirección laboral")
                                      ? ""
                                      : "Av. Principal #456"
                                  }
                                  readOnly
                                  className={
                                    ficha.estado === "incompleta" && ficha.observaciones?.includes("dirección laboral")
                                      ? "border-red-500"
                                      : ""
                                  }
                                />
                                {ficha.estado === "incompleta" &&
                                  ficha.observaciones?.includes("dirección laboral") && (
                                    <p className="text-xs text-red-500">Información pendiente</p>
                                  )}
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Teléfono Laboral</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["telefono_laboral"] || false}
                                            onCheckedChange={(checked) =>
                                              handleToggleValidacion("telefono_laboral", checked)
                                            }
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value="+123 456 7891" readOnly />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Años de Experiencia</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["experiencia"] || false}
                                            onCheckedChange={(checked) =>
                                              handleToggleValidacion("experiencia", checked)
                                            }
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value="5 años" readOnly />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Referencias Personales</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["referencias"] || false}
                                            onCheckedChange={(checked) =>
                                              handleToggleValidacion("referencias", checked)
                                            }
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input
                                  value={
                                    ficha.camposIncompletos?.includes("referencias_personales")
                                      ? ""
                                      : "Juan Pérez - +123 456 7892"
                                  }
                                  readOnly
                                  className={
                                    ficha.camposIncompletos?.includes("referencias_personales") ? "border-red-500" : ""
                                  }
                                />
                                {ficha.camposIncompletos?.includes("referencias_personales") && (
                                  <p className="text-xs text-red-500">Información pendiente</p>
                                )}
                              </div>
                            </div>
                          </TabsContent>
                          <TabsContent value="financieros" className="p-4 border rounded-md mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Método de Pago</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["metodo_pago"] || false}
                                            onCheckedChange={(checked) =>
                                              handleToggleValidacion("metodo_pago", checked)
                                            }
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value="Transferencia Bancaria" readOnly />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Plan de Pago</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["plan_pago"] || false}
                                            onCheckedChange={(checked) => handleToggleValidacion("plan_pago", checked)}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value="Mensual" readOnly />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Banco</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["banco"] || false}
                                            onCheckedChange={(checked) => handleToggleValidacion("banco", checked)}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value="Banco Nacional" readOnly />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Referencia de Pago</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["referencia_pago"] || false}
                                            onCheckedChange={(checked) =>
                                              handleToggleValidacion("referencia_pago", checked)
                                            }
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value="REF-12345" readOnly />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Monto Mensual</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["monto_mensual"] || false}
                                            onCheckedChange={(checked) =>
                                              handleToggleValidacion("monto_mensual", checked)
                                            }
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <Input value="Q1,400.00" readOnly />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Comprobante Inicial</Label>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Switch
                                            checked={camposValidados["comprobante"] || false}
                                            onCheckedChange={(checked) =>
                                              handleToggleValidacion("comprobante", checked)
                                            }
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Marcar como validado</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <span>Comprobante cargado</span>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                        <div className="mt-6 flex flex-col space-y-3">
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                            <h4 className="font-semibold mb-1">Estado de Validación</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-sm">
                                  Campos validados: {Object.values(camposValidados).filter(Boolean).length}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span className="text-sm">
                                  Campos pendientes: {ficha.camposIncompletos?.length || 0}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                            <h4 className="font-semibold mb-1">Observaciones</h4>
                            <p className="text-sm">
                              {ficha.observaciones || "No hay observaciones registradas para esta ficha."}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="comentario-revision">Comentario de Revisión</Label>
                            <Textarea
                              id="comentario-revision"
                              placeholder="Ingrese comentarios sobre la revisión de esta ficha..."
                              value={comentarioRevision}
                              onChange={(e) => setComentarioRevision(e.target.value)}
                              className="h-20"
                            />
                          </div>

                          {showSuccessMessage && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                              <div className="flex items-center">
                                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                <p className="text-sm text-green-600 dark:text-green-400">Acción realizada con éxito</p>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end space-x-3">
                            <Button variant="outline" onClick={handleSolicitarCorreccion}>
                              <Send className="mr-2 h-4 w-4" /> Solicitar Corrección
                            </Button>
                            <Button onClick={handleMarcarRevisada}>
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Marcar como Revisada
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 ml-2">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                        <DropdownMenuItem>Marcar como Revisada</DropdownMenuItem>
                        <DropdownMenuItem>Solicitar Corrección</DropdownMenuItem>
                        <DropdownMenuItem>Asignar a Revisor</DropdownMenuItem>
                        <DropdownMenuItem>Exportar Ficha</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredFichas.length} de {fichas.length} fichas
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Anterior
            </Button>
            <Button variant="outline" size="sm">
              Siguiente
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

