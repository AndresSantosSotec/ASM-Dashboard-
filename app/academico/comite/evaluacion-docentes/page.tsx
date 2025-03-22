"use client"

import { useState } from "react"
import {
  Award,
  Search,
  Filter,
  Download,
  FileText,
  Check,
  X,
  Star,
  Calendar,
  User,
  Pencil,
  Save,
  Info,
  Upload,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Datos de ejemplo
const docentes = [
  {
    id: 1,
    nombre: "Dr. Juan Pérez",
    departamento: "Ciencias",
    especialidad: "Metodología de la Investigación",
    evaluacionPromedio: 4.8,
    ultimaEvaluacion: "2023-12-15",
    estado: "Evaluado",
  },
  {
    id: 2,
    nombre: "Dra. María Rodríguez",
    departamento: "Humanidades",
    especialidad: "Filosofía Contemporánea",
    evaluacionPromedio: 4.5,
    ultimaEvaluacion: "2023-11-20",
    estado: "Evaluado",
  },
  {
    id: 3,
    nombre: "Mtro. Carlos López",
    departamento: "Ingeniería",
    especialidad: "Programación Avanzada",
    evaluacionPromedio: 4.2,
    ultimaEvaluacion: "2023-10-05",
    estado: "Evaluado",
  },
  {
    id: 4,
    nombre: "Dra. Ana Martínez",
    departamento: "Ciencias Sociales",
    especialidad: "Estadística Aplicada",
    evaluacionPromedio: null,
    ultimaEvaluacion: null,
    estado: "Pendiente",
  },
  {
    id: 5,
    nombre: "Dr. Roberto Sánchez",
    departamento: "Ciencias de la Salud",
    especialidad: "Anatomía Humana",
    evaluacionPromedio: null,
    ultimaEvaluacion: null,
    estado: "Pendiente",
  },
]

const criteriosEvaluacion = [
  {
    id: 1,
    nombre: "Dominio de la materia",
    descripcion: "Conocimiento profundo y actualizado de los contenidos que imparte",
  },
  {
    id: 2,
    nombre: "Metodología de enseñanza",
    descripcion: "Estrategias y técnicas utilizadas para facilitar el aprendizaje",
  },
  {
    id: 3,
    nombre: "Cumplimiento del programa",
    descripcion: "Desarrollo completo y oportuno de los contenidos programados",
  },
  {
    id: 4,
    nombre: "Atención a estudiantes",
    descripcion: "Disponibilidad y calidad en la atención de dudas y consultas",
  },
  { id: 5, nombre: "Material didáctico", descripcion: "Calidad y pertinencia de los recursos utilizados" },
  {
    id: 6,
    nombre: "Evaluación del aprendizaje",
    descripcion: "Pertinencia y objetividad de los métodos de evaluación",
  },
  { id: 7, nombre: "Puntualidad y asistencia", descripcion: "Cumplimiento de horarios y compromisos académicos" },
  {
    id: 8,
    nombre: "Actualización profesional",
    descripcion: "Evidencia de formación continua y actualización en su área",
  },
]

export default function EvaluacionDocentes() {
  const [filtro, setFiltro] = useState("")
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<any>(null)
  const [mostrarAlerta, setMostrarAlerta] = useState(false)
  const [criterios, setCriterios] = useState<{ [key: number]: number }>({})
  const [comentarios, setComentarios] = useState("")
  const [areasDestacadas, setAreasDestacadas] = useState<string[]>([])
  const [areasMejora, setAreasMejora] = useState<string[]>([])

  const docentesFiltrados = docentes.filter(
    (docente) =>
      docente.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      docente.departamento.toLowerCase().includes(filtro.toLowerCase()) ||
      docente.especialidad.toLowerCase().includes(filtro.toLowerCase()),
  )

  const handleSeleccionarDocente = (docente: any) => {
    setDocenteSeleccionado(docente)
    // Reiniciar los criterios si es un docente pendiente
    if (docente.estado === "Pendiente") {
      setCriterios({})
      setComentarios("")
      setAreasDestacadas([])
      setAreasMejora([])
    }
  }

  const handleGuardarEvaluacion = () => {
    // Calcular promedio de evaluación
    const valores = Object.values(criterios) as number[]
    const promedio = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0

    // Actualizar el docente (en un caso real, esto sería una llamada a la API)
    const fecha = new Date().toISOString().split("T")[0]

    // Actualizar la lista de docentes
    const nuevosDocentes = docentes.map((d) => {
      if (d.id === docenteSeleccionado.id) {
        return {
          ...d,
          evaluacionPromedio: Number(promedio.toFixed(1)),
          ultimaEvaluacion: fecha,
          estado: "Evaluado",
        }
      }
      return d
    })

    // Actualizar el estado
    setDocenteSeleccionado({
      ...docenteSeleccionado,
      evaluacionPromedio: Number(promedio.toFixed(1)),
      ultimaEvaluacion: fecha,
      estado: "Evaluado",
    })

    // Mostrar alerta de éxito
    setMostrarAlerta(true)
    setTimeout(() => setMostrarAlerta(false), 3000)
  }

  const handleCriterioChange = (criterioId: number, valor: number) => {
    setCriterios((prev) => ({ ...prev, [criterioId]: valor }))
  }

  const handleToggleAreaDestacada = (area: string) => {
    if (areasDestacadas.includes(area)) {
      setAreasDestacadas(areasDestacadas.filter((a) => a !== area))
    } else {
      setAreasDestacadas([...areasDestacadas, area])
    }
  }

  const handleToggleAreaMejora = (area: string) => {
    if (areasMejora.includes(area)) {
      setAreasMejora(areasMejora.filter((a) => a !== area))
    } else {
      setAreasMejora([...areasMejora, area])
    }
  }

  const calcularPromedioActual = () => {
    const valores = Object.values(criterios) as number[]
    return valores.length > 0 ? (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(1) : "0.0"
  }

  return (
    <div className="space-y-6">
      {mostrarAlerta && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Evaluación guardada correctamente</AlertTitle>
          <AlertDescription className="text-green-700">
            La evaluación del docente ha sido registrada en el sistema.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Evaluación de Docentes</h1>
          <p className="text-muted-foreground">Comité Académico - Evaluación de desempeño docente</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar Reporte
          </Button>
          <Button size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtros Avanzados
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Docentes</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar docente..."
                  className="pl-8"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                />
              </div>
            </div>
            <CardDescription>Seleccione un docente para ver o registrar su evaluación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Especialidad</TableHead>
                    <TableHead>Evaluación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docentesFiltrados.map((docente) => (
                    <TableRow key={docente.id} className={docenteSeleccionado?.id === docente.id ? "bg-muted/50" : ""}>
                      <TableCell className="font-medium">{docente.nombre}</TableCell>
                      <TableCell>{docente.departamento}</TableCell>
                      <TableCell>{docente.especialidad}</TableCell>
                      <TableCell>
                        {docente.evaluacionPromedio ? (
                          <div className="flex items-center">
                            <div className="flex items-center mr-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= Math.floor(docente.evaluacionPromedio)
                                      ? "text-yellow-500 fill-yellow-500"
                                      : star - docente.evaluacionPromedio < 1 && star - docente.evaluacionPromedio > 0
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                            <span>{docente.evaluacionPromedio}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No evaluado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {docente.estado === "Evaluado" ? (
                          <Badge className="bg-green-100 text-green-800">Evaluado</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleSeleccionarDocente(docente)}>
                          {docente.estado === "Evaluado" ? (
                            <FileText className="h-4 w-4" />
                          ) : (
                            <Pencil className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de Evaluaciones</CardTitle>
            <CardDescription>Estado actual de las evaluaciones docentes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Total de docentes</div>
              <div className="font-bold">{docentes.length}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Evaluados</div>
              <div className="font-bold">{docentes.filter((d) => d.estado === "Evaluado").length}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Pendientes</div>
              <div className="font-bold">{docentes.filter((d) => d.estado === "Pendiente").length}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Promedio general</div>
              <div className="font-bold">
                {(
                  docentes
                    .filter((d) => d.evaluacionPromedio)
                    .reduce((sum, d) => sum + (d.evaluacionPromedio || 0), 0) /
                  docentes.filter((d) => d.evaluacionPromedio).length
                ).toFixed(1)}
              </div>
            </div>

            <div className="pt-4">
              <h3 className="text-sm font-medium mb-2">Departamentos</h3>
              <div className="space-y-2">
                {Array.from(new Set(docentes.map((d) => d.departamento))).map((departamento) => (
                  <div key={departamento} className="flex items-center justify-between text-sm">
                    <div>{departamento}</div>
                    <Badge variant="outline">{docentes.filter((d) => d.departamento === departamento).length}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {docenteSeleccionado && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  {docenteSeleccionado.nombre}
                </CardTitle>
                <CardDescription>
                  {docenteSeleccionado.departamento} - {docenteSeleccionado.especialidad}
                </CardDescription>
              </div>
              <Badge
                className={
                  docenteSeleccionado.estado === "Evaluado"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-50 text-yellow-700 border-yellow-200"
                }
              >
                {docenteSeleccionado.estado}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={docenteSeleccionado.estado === "Evaluado" ? "resumen" : "evaluacion"}>
              <TabsList className="grid grid-cols-2 w-full md:w-auto">
                <TabsTrigger value="resumen" disabled={docenteSeleccionado.estado !== "Evaluado"}>
                  Resumen de Evaluación
                </TabsTrigger>
                <TabsTrigger value="evaluacion">
                  {docenteSeleccionado.estado === "Evaluado" ? "Editar Evaluación" : "Nueva Evaluación"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="resumen" className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Calificación General</h3>
                    <div className="flex items-center mt-1">
                      <div className="flex items-center mr-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.floor(docenteSeleccionado.evaluacionPromedio)
                                ? "text-yellow-500 fill-yellow-500"
                                : star - docenteSeleccionado.evaluacionPromedio < 1 &&
                                    star - docenteSeleccionado.evaluacionPromedio > 0
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">{docenteSeleccionado.evaluacionPromedio}/5.0</span>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Aprobado</Badge>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Comentarios del Comité</h3>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    El docente ha demostrado un buen desempeño en sus funciones académicas. Se destaca su compromiso con
                    la calidad educativa y su disposición para implementar mejoras en sus metodologías de enseñanza. Se
                    recomienda continuar con su desarrollo profesional en áreas de innovación pedagógica.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <h3 className="font-medium mb-2">Áreas destacadas</h3>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center">
                        <Award className="h-4 w-4 text-green-500 mr-2" />
                        Metodología de enseñanza
                      </li>
                      <li className="flex items-center">
                        <Award className="h-4 w-4 text-green-500 mr-2" />
                        Atención a estudiantes
                      </li>
                      <li className="flex items-center">
                        <Award className="h-4 w-4 text-green-500 mr-2" />
                        Cumplimiento de plazos
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Áreas de mejora</h3>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center">
                        <Calendar className="h-4 w-4 text-amber-500 mr-2" />
                        Uso de tecnologías educativas
                      </li>
                      <li className="flex items-center">
                        <Calendar className="h-4 w-4 text-amber-500 mr-2" />
                        Actualización de contenidos
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="font-medium mb-2">Fecha de evaluación</h3>
                  <p className="text-sm">{docenteSeleccionado.ultimaEvaluacion}</p>
                </div>

                <div className="flex justify-end pt-4">
                  <Button variant="outline" className="mr-2">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar informe
                  </Button>
                  <Button>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar evaluación
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="evaluacion" className="mt-4 space-y-6">
                <Alert variant="outline" className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Información importante</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    La evaluación del comité académico es un proceso formal que quedará registrado en el expediente del
                    docente. Por favor, complete todos los criterios con objetividad.
                  </AlertDescription>
                </Alert>

                {/* Sección destacada para cargar calificación */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Upload className="mr-2 h-5 w-5 text-primary" />
                      Cargar Calificación del Comité Académico
                    </CardTitle>
                    <CardDescription>
                      Ingrese la calificación general o evalúe por criterios individuales
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <Label htmlFor="calificacion-general" className="font-medium">
                          Calificación General Directa
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={calcularPromedioActual() !== "0.0" ? calcularPromedioActual() : ""}
                            onValueChange={(value) => {
                              // Establecer todos los criterios con el mismo valor
                              const nuevosValores: { [key: number]: number } = {}
                              criteriosEvaluacion.forEach((criterio) => {
                                nuevosValores[criterio.id] = Number(value)
                              })
                              setCriterios(nuevosValores)
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccione una calificación" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1.0">1.0 - Insuficiente</SelectItem>
                              <SelectItem value="2.0">2.0 - Regular</SelectItem>
                              <SelectItem value="3.0">3.0 - Aceptable</SelectItem>
                              <SelectItem value="4.0">4.0 - Bueno</SelectItem>
                              <SelectItem value="5.0">5.0 - Excelente</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            className="flex-shrink-0"
                            onClick={() => {
                              // Mostrar alerta de éxito
                              setMostrarAlerta(true)
                              setTimeout(() => setMostrarAlerta(false), 3000)

                              // Actualizar el docente con la calificación general
                              const fecha = new Date().toISOString().split("T")[0]
                              setDocenteSeleccionado({
                                ...docenteSeleccionado,
                                evaluacionPromedio: Number(calcularPromedioActual()),
                                ultimaEvaluacion: fecha,
                                estado: "Evaluado",
                              })
                            }}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Cargar Calificación
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Esta opción asigna la misma calificación a todos los criterios. Para una evaluación más
                          detallada, utilice los criterios individuales.
                        </p>
                      </div>

                      <div className="flex flex-col justify-center items-center bg-muted/50 rounded-lg p-4">
                        <h3 className="font-medium mb-2">Vista previa de calificación</h3>
                        <div className="flex items-center mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-6 w-6 ${
                                star <= Math.floor(Number(calcularPromedioActual()))
                                  ? "text-yellow-500 fill-yellow-500"
                                  : star - Number(calcularPromedioActual()) < 1 &&
                                      star - Number(calcularPromedioActual()) > 0
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-2xl font-bold">{calcularPromedioActual()}/5.0</span>
                        <Badge
                          className={
                            Number(calcularPromedioActual()) >= 3.0
                              ? "bg-green-100 text-green-800 mt-2"
                              : "bg-red-100 text-red-800 mt-2"
                          }
                        >
                          {Number(calcularPromedioActual()) >= 3.0 ? "Aprobado" : "No Aprobado"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <h3 className="font-medium">Criterios de Evaluación Detallados</h3>
                  <div className="space-y-4">
                    {criteriosEvaluacion.map((criterio) => (
                      <div key={criterio.id} className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor={`criterio-${criterio.id}`} className="font-medium">
                            {criterio.nombre}
                          </Label>
                          <span className="text-sm font-medium">{criterios[criterio.id] || 0}/5</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{criterio.descripcion}</p>
                        <div className="flex items-center space-x-2">
                          {[1, 2, 3, 4, 5].map((valor) => (
                            <Button
                              key={valor}
                              type="button"
                              size="sm"
                              variant={criterios[criterio.id] === valor ? "default" : "outline"}
                              className="w-10 h-10 p-0"
                              onClick={() => handleCriterioChange(criterio.id, valor)}
                            >
                              {valor}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Calificación promedio</h3>
                      <div className="flex items-center">
                        <div className="flex items-center mr-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= Math.floor(Number(calcularPromedioActual()))
                                  ? "text-yellow-500 fill-yellow-500"
                                  : star - Number(calcularPromedioActual()) < 1 &&
                                      star - Number(calcularPromedioActual()) > 0
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium">{calcularPromedioActual()}/5.0</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Label htmlFor="comentarios" className="font-medium">
                      Comentarios del Comité
                    </Label>
                    <Textarea
                      id="comentarios"
                      placeholder="Ingrese los comentarios y observaciones del comité académico..."
                      value={comentarios}
                      onChange={(e) => setComentarios(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                      <Label className="font-medium">Áreas destacadas</Label>
                      <div className="space-y-2">
                        {criteriosEvaluacion.map((criterio) => (
                          <div key={`destacada-${criterio.id}`} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`destacada-${criterio.id}`}
                              className="mr-2"
                              checked={areasDestacadas.includes(criterio.nombre)}
                              onChange={() => handleToggleAreaDestacada(criterio.nombre)}
                            />
                            <Label htmlFor={`destacada-${criterio.id}`} className="text-sm">
                              {criterio.nombre}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium">Áreas de mejora</Label>
                      <div className="space-y-2">
                        {criteriosEvaluacion.map((criterio) => (
                          <div key={`mejora-${criterio.id}`} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`mejora-${criterio.id}`}
                              className="mr-2"
                              checked={areasMejora.includes(criterio.nombre)}
                              onChange={() => handleToggleAreaMejora(criterio.nombre)}
                            />
                            <Label htmlFor={`mejora-${criterio.id}`} className="text-sm">
                              {criterio.nombre}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button variant="outline" className="mr-2" onClick={() => setDocenteSeleccionado(null)}>
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button onClick={handleGuardarEvaluacion} className="bg-primary hover:bg-primary/90">
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Evaluación Completa
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

