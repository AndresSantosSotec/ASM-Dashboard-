"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Search, Upload, X, FileText, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"

// Ejemplo de prospectos (datos dummy)
const prospectosDummy = [
  {
    id: 1,
    nombreCompleto: "Juan Pérez",
    paisOrigen: "Guatemala",
    paisResidencia: "Guatemala",
    telefono: "12345678",
    dpi: "1234567890101",
    emailPersonal: "juan.perez@example.com",
    emailCorporativo: "juan.perez@empresa.com",
    fechaNacimiento: "1990-05-15",
    empresa: "Empresa X",
    puesto: "Gerente de Proyectos",
    telefonoCorporativo: "87654321",
    departamento: "Guatemala",
    estado: "Nuevo",
    fechaRegistro: "2023-10-01",
    programaInteres: "MPM",
    fuenteCaptura: "Facebook",
  },
  {
    id: 2,
    nombreCompleto: "María García",
    paisOrigen: "México",
    paisResidencia: "Guatemala",
    telefono: "55551234",
    dpi: "9876543210101",
    emailPersonal: "maria.garcia@example.com",
    emailCorporativo: "maria.garcia@otraempresa.com",
    fechaNacimiento: "1985-10-20",
    empresa: "Otra Empresa",
    puesto: "Coordinadora de Proyectos",
    telefonoCorporativo: "55123456",
    departamento: "Quetzaltenango",
    estado: "En proceso",
    fechaRegistro: "2023-10-02",
    programaInteres: "BBA 18",
    fuenteCaptura: "Instagram",
  },
  {
    id: 3,
    nombreCompleto: "Carlos López",
    paisOrigen: "Guatemala",
    paisResidencia: "Guatemala",
    telefono: "33334444",
    dpi: "5555666677778",
    emailPersonal: "carlos.lopez@example.com",
    emailCorporativo: "carlos.lopez@empresa.com",
    fechaNacimiento: "1988-03-15",
    empresa: "Banco Nacional",
    puesto: "Analista Financiero",
    telefonoCorporativo: "33335555",
    departamento: "Escuintla",
    estado: "Contactado",
    fechaRegistro: "2023-10-03",
    programaInteres: "Maestría 9",
    fuenteCaptura: "Referido",
  },
  {
    id: 4,
    nombreCompleto: "Ana Martínez",
    paisOrigen: "El Salvador",
    paisResidencia: "Guatemala",
    telefono: "77778888",
    dpi: "1111222233334",
    emailPersonal: "ana.martinez@example.com",
    emailCorporativo: "ana.martinez@empresa.com",
    fechaNacimiento: "1992-07-25",
    empresa: "Grupo Industrial",
    puesto: "Coordinadora de RRHH",
    telefonoCorporativo: "77779999",
    departamento: "Sacatepéquez",
    estado: "Calificado",
    fechaRegistro: "2023-10-04",
    programaInteres: "MPM",
    fuenteCaptura: "Evento",
  },
]

// Interfaz para los documentos
interface Documento {
  id: string
  nombre: string
  descripcion: string
  estado: "pendiente" | "cargado"
  archivo?: File | null
}

export function RegistrationForm() {
  // Estado para el progreso del formulario
  const [progress, setProgress] = useState(20)
  const [activeTab, setActiveTab] = useState("personal")

  // Estado para abrir/cerrar modal de búsqueda
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDepartamento, setFilterDepartamento] = useState("todos")

  // Estado para los datos del formulario "Datos Personales"
  const [datosPersonales, setDatosPersonales] = useState({
    nombre: "Eduardo Luis Ramos Lemus",
    paisOrigen: "Guatemala",
    paisResidencia: "Guatemala",
    telefono: "42150787",
    dpi: "1642386030101",
    emailPersonal: "eduardo.rl896@gmail.com",
    emailCorporativo: "eduardo.rl896@gmail.com",
    fechaNacimiento: "1989-08-23",
    direccion: "",
  })

  // Estado para los datos del formulario "Datos Laborales"
  const [datosLaborales, setDatosLaborales] = useState({
    empresa: "PAN AMERICAN SILVER",
    puesto: "Superintendente de Producción",
    telefonoCorporativo: "42150787",
    direccionEmpresa: "",
    departamento: "",
    sectorEmpresa: "",
  })

  // Estado para los datos académicos
  const [datosAcademicos, setDatosAcademicos] = useState({
    programa: "mpm",
    duracion: "21",
    ultimoTitulo: "licenciatura",
    modalidad: "sincronica",
    fechaInicio: "enero",
    diaEstudio: "jueves",
    fechaInicioEspecifica: "2025-01-09",
    fechaTallerInduccion: "2025-01-06",
    fechaTallerIntegracion: "2025-01-10",
    institucionAnterior: "",
    añoGraduacion: "",
    medioConocio: "otros",
    observaciones: "Corporativo American",
    cursosAprobados: "",
    titulo1: "",
    titulo2: "MPM - Master of Project Management",
    titulo3: "",
  })

  // Estado para los datos financieros
  const [datosFinancieros, setDatosFinancieros] = useState({
    beca: "no",
    porcentajeBeca: "0%",
    formaPago: "debito",
    inscripcion: "1,000.00",
    cuotaMensual: "1,400.00",
    cantidadMeses: "18",
    inversionTotal: "26,200.00",
    referencia: "",
    aceptaTerminos: false,
  })

  // Estado para los documentos
  const [documentos, setDocumentos] = useState<Documento[]>([
    {
      id: "dpi",
      nombre: "DPI (Ambos lados)",
      descripcion: "Documento de identificación personal, ambos lados en un solo archivo.",
      estado: "pendiente",
      archivo: null,
    },
    {
      id: "recibo",
      nombre: "Recibo de luz o teléfono",
      descripcion: "Comprobante de domicilio reciente (no mayor a 3 meses).",
      estado: "pendiente",
      archivo: null,
    },
    {
      id: "american",
      nombre: "Recibo de American",
      descripcion: "Comprobante de pago emitido por American SM.",
      estado: "pendiente",
      archivo: null,
    },
    {
      id: "inscripcion",
      nombre: "Boleta de pago de inscripción",
      descripcion: "Comprobante de pago de la cuota de inscripción.",
      estado: "pendiente",
      archivo: null,
    },
    {
      id: "titulo",
      nombre: "Título o diploma",
      descripcion: "Copia de su último título académico obtenido.",
      estado: "pendiente",
      archivo: null,
    },
    {
      id: "foto",
      nombre: "Fotografía reciente",
      descripcion: "Fotografía tamaño carné con fondo blanco.",
      estado: "pendiente",
      archivo: null,
    },
  ])

  // Función para manejar la selección de un prospecto
  const handleSelectProspecto = (prospecto: any) => {
    setDatosPersonales({
      ...datosPersonales,
      nombre: prospecto.nombreCompleto,
      paisOrigen: prospecto.paisOrigen,
      paisResidencia: prospecto.paisResidencia,
      telefono: prospecto.telefono,
      dpi: prospecto.dpi,
      emailPersonal: prospecto.emailPersonal,
      emailCorporativo: prospecto.emailCorporativo,
      fechaNacimiento: prospecto.fechaNacimiento,
    })

    setDatosLaborales({
      ...datosLaborales,
      empresa: prospecto.empresa,
      puesto: prospecto.puesto,
      telefonoCorporativo: prospecto.telefonoCorporativo,
      departamento: prospecto.departamento,
    })

    // Cerrar modal
    setShowModal(false)
  }

  // Filtrar prospectos según búsqueda y departamento
  const filteredProspectos = prospectosDummy.filter((prospecto) => {
    const matchSearch =
      prospecto.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospecto.emailPersonal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospecto.telefono.includes(searchTerm)

    const matchDepartamento = filterDepartamento === "todos" || prospecto.departamento === filterDepartamento

    return matchSearch && matchDepartamento
  })

  // Manejar la carga de documentos
  const handleFileUpload = (documentoId: string, file: File) => {
    setDocumentos((prev) =>
      prev.map((doc) => (doc.id === documentoId ? { ...doc, archivo: file, estado: "cargado" as const } : doc)),
    )
  }

  // Actualizar progreso al cambiar de pestaña
  const handleTabChange = (value: string) => {
    setActiveTab(value)

    // Actualizar progreso basado en la pestaña activa
    switch (value) {
      case "personal":
        setProgress(20)
        break
      case "laboral":
        setProgress(40)
        break
      case "academico":
        setProgress(60)
        break
      case "financiero":
        setProgress(80)
        break
      case "documentos":
        setProgress(100)
        break
      default:
        setProgress(20)
    }
  }

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-primary">Ficha de Inscripción</h1>
          <span className="text-sm text-muted-foreground">Paso 2 de 6</span>
        </div>
        <Progress value={progress} className="h-2 w-full" />
      </div>

      <Card className="border-2 border-muted shadow-md">
        <CardContent className="p-6">
          <Tabs defaultValue="personal" className="w-full" onValueChange={handleTabChange}>
            <TabsList className="mb-6 grid w-full grid-cols-2 md:grid-cols-5 bg-muted/30">
              <TabsTrigger
                value="personal"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Datos Personales
              </TabsTrigger>
              <TabsTrigger
                value="laboral"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Datos Laborales
              </TabsTrigger>
              <TabsTrigger
                value="academico"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Información Académica
              </TabsTrigger>
              <TabsTrigger
                value="financiero"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Datos Financieros
              </TabsTrigger>
              <TabsTrigger
                value="documentos"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Documentos
              </TabsTrigger>
            </TabsList>

            {/* Modal de búsqueda de prospectos */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Búsqueda de Prospectos</DialogTitle>
                  <DialogDescription>
                    Seleccione un prospecto para cargar sus datos automáticamente en el formulario.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar por nombre, email o teléfono..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={filterDepartamento} onValueChange={setFilterDepartamento}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los departamentos</SelectItem>
                      <SelectItem value="Guatemala">Guatemala</SelectItem>
                      <SelectItem value="Quetzaltenango">Quetzaltenango</SelectItem>
                      <SelectItem value="Escuintla">Escuintla</SelectItem>
                      <SelectItem value="Sacatepéquez">Sacatepéquez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <ScrollArea className="h-[400px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProspectos.length > 0 ? (
                        filteredProspectos.map((prospecto) => (
                          <TableRow key={prospecto.id}>
                            <TableCell className="font-medium">{prospecto.nombreCompleto}</TableCell>
                            <TableCell>{prospecto.emailPersonal}</TableCell>
                            <TableCell>{prospecto.telefono}</TableCell>
                            <TableCell>{prospecto.departamento}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  prospecto.estado === "Nuevo"
                                    ? "bg-blue-100 text-blue-800"
                                    : prospecto.estado === "En proceso"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : prospecto.estado === "Contactado"
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-green-100 text-green-800"
                                }
                              >
                                {prospecto.estado}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button size="sm" onClick={() => handleSelectProspecto(prospecto)}>
                                Seleccionar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                            No se encontraron prospectos con los criterios de búsqueda.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowModal(false)}>
                    Cancelar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Pestaña: Datos Personales */}
            <TabsContent value="personal" className="space-y-6">
              {/* Botón para abrir la búsqueda de prospecto */}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowModal(true)} className="mb-4">
                  <Search className="mr-2 h-4 w-4" />
                  Buscar prospecto
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre">
                    Nombre completo (Como aparece en DPI) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nombre"
                    value={datosPersonales.nombre}
                    onChange={(e) => setDatosPersonales({ ...datosPersonales, nombre: e.target.value })}
                    placeholder="Ingrese su nombre completo"
                    required
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pais-origen">
                      País de origen <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={datosPersonales.paisOrigen}
                      onValueChange={(val) => setDatosPersonales({ ...datosPersonales, paisOrigen: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar país" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Guatemala">Guatemala</SelectItem>
                        <SelectItem value="El Salvador">El Salvador</SelectItem>
                        <SelectItem value="Honduras">Honduras</SelectItem>
                        <SelectItem value="Nicaragua">Nicaragua</SelectItem>
                        <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                        <SelectItem value="Panamá">Panamá</SelectItem>
                        <SelectItem value="México">México</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pais-residencia">
                      País de residencia <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={datosPersonales.paisResidencia}
                      onValueChange={(val) => setDatosPersonales({ ...datosPersonales, paisResidencia: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar país" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Guatemala">Guatemala</SelectItem>
                        <SelectItem value="El Salvador">El Salvador</SelectItem>
                        <SelectItem value="Honduras">Honduras</SelectItem>
                        <SelectItem value="Nicaragua">Nicaragua</SelectItem>
                        <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                        <SelectItem value="Panamá">Panamá</SelectItem>
                        <SelectItem value="México">México</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">
                    Teléfono móvil <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="telefono"
                    value={datosPersonales.telefono}
                    onChange={(e) => setDatosPersonales({ ...datosPersonales, telefono: e.target.value })}
                    placeholder="Ej. 55123456"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dpi">
                    No. de Identificación (DPI) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dpi"
                    value={datosPersonales.dpi}
                    onChange={(e) => setDatosPersonales({ ...datosPersonales, dpi: e.target.value })}
                    placeholder="Ej. 1234567890101"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-personal">
                    Correo electrónico personal <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email-personal"
                    type="email"
                    value={datosPersonales.emailPersonal}
                    onChange={(e) =>
                      setDatosPersonales({
                        ...datosPersonales,
                        emailPersonal: e.target.value,
                      })
                    }
                    placeholder="ejemplo@correo.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-corporativo">Correo electrónico corporativo</Label>
                  <Input
                    id="email-corporativo"
                    type="email"
                    value={datosPersonales.emailCorporativo}
                    onChange={(e) =>
                      setDatosPersonales({
                        ...datosPersonales,
                        emailCorporativo: e.target.value,
                      })
                    }
                    placeholder="ejemplo@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha-nacimiento">
                    Fecha de nacimiento <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fecha-nacimiento"
                    type="date"
                    value={datosPersonales.fechaNacimiento}
                    onChange={(e) =>
                      setDatosPersonales({
                        ...datosPersonales,
                        fechaNacimiento: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="direccion">
                    Dirección de residencia <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="direccion"
                    value={datosPersonales.direccion}
                    onChange={(e) => setDatosPersonales({ ...datosPersonales, direccion: e.target.value })}
                    placeholder="Ingrese su dirección completa"
                    className="min-h-[80px]"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-between space-y-4 space-y-reverse sm:space-y-0 sm:space-x-4 mt-6">
                <Link href="/inscripcion/bienvenida">
                  <Button variant="outline" className="w-full sm:w-auto gap-2">
                    <ArrowLeft className="h-4 w-4" /> Anterior
                  </Button>
                </Link>
                <Button
                  type="button"
                  onClick={() => document.querySelector('[data-value="laboral"]')?.click()}
                  className="w-full sm:w-auto"
                >
                  Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Pestaña: Datos Laborales */}
            <TabsContent value="laboral" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="empresa">
                    Empresa en donde labora <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="empresa"
                    value={datosLaborales.empresa}
                    onChange={(e) => setDatosLaborales({ ...datosLaborales, empresa: e.target.value })}
                    placeholder="Nombre de la empresa"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="puesto">
                    Puesto de trabajo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="puesto"
                    value={datosLaborales.puesto}
                    onChange={(e) => setDatosLaborales({ ...datosLaborales, puesto: e.target.value })}
                    placeholder="Cargo actual"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono-corporativo">Teléfono corporativo</Label>
                  <Input
                    id="telefono-corporativo"
                    value={datosLaborales.telefonoCorporativo}
                    onChange={(e) =>
                      setDatosLaborales({
                        ...datosLaborales,
                        telefonoCorporativo: e.target.value,
                      })
                    }
                    placeholder="Teléfono de la empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departamento">
                    Departamento <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={datosLaborales.departamento}
                    onValueChange={(val) => setDatosLaborales({ ...datosLaborales, departamento: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Guatemala">Guatemala</SelectItem>
                      <SelectItem value="Alta Verapaz">Alta Verapaz</SelectItem>
                      <SelectItem value="Baja Verapaz">Baja Verapaz</SelectItem>
                      <SelectItem value="Chimaltenango">Chimaltenango</SelectItem>
                      <SelectItem value="Chiquimula">Chiquimula</SelectItem>
                      <SelectItem value="El Progreso">El Progreso</SelectItem>
                      <SelectItem value="Escuintla">Escuintla</SelectItem>
                      <SelectItem value="Huehuetenango">Huehuetenango</SelectItem>
                      <SelectItem value="Izabal">Izabal</SelectItem>
                      <SelectItem value="Jalapa">Jalapa</SelectItem>
                      <SelectItem value="Jutiapa">Jutiapa</SelectItem>
                      <SelectItem value="Petén">Petén</SelectItem>
                      <SelectItem value="Quetzaltenango">Quetzaltenango</SelectItem>
                      <SelectItem value="Quiché">Quiché</SelectItem>
                      <SelectItem value="Retalhuleu">Retalhuleu</SelectItem>
                      <SelectItem value="Sacatepéquez">Sacatepéquez</SelectItem>
                      <SelectItem value="San Marcos">San Marcos</SelectItem>
                      <SelectItem value="Santa Rosa">Santa Rosa</SelectItem>
                      <SelectItem value="Sololá">Sololá</SelectItem>
                      <SelectItem value="Suchitepéquez">Suchitepéquez</SelectItem>
                      <SelectItem value="Totonicapán">Totonicapán</SelectItem>
                      <SelectItem value="Zacapa">Zacapa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector-empresa">
                    Sector de la empresa <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={datosLaborales.sectorEmpresa}
                    onValueChange={(val) => setDatosLaborales({ ...datosLaborales, sectorEmpresa: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sector" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agricultura">Agricultura y ganadería</SelectItem>
                      <SelectItem value="mineria">Minería</SelectItem>
                      <SelectItem value="manufactura">Manufactura</SelectItem>
                      <SelectItem value="construccion">Construcción</SelectItem>
                      <SelectItem value="comercio">Comercio</SelectItem>
                      <SelectItem value="transporte">Transporte</SelectItem>
                      <SelectItem value="turismo">Turismo y hostelería</SelectItem>
                      <SelectItem value="telecomunicaciones">Telecomunicaciones</SelectItem>
                      <SelectItem value="financiero">Servicios financieros</SelectItem>
                      <SelectItem value="educacion">Educación</SelectItem>
                      <SelectItem value="salud">Salud</SelectItem>
                      <SelectItem value="gobierno">Gobierno</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="direccion-empresa">
                    Dirección de la empresa <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="direccion-empresa"
                    value={datosLaborales.direccionEmpresa}
                    onChange={(e) => setDatosLaborales({ ...datosLaborales, direccionEmpresa: e.target.value })}
                    placeholder="Dirección completa de la empresa"
                    className="min-h-[80px]"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-between space-y-4 space-y-reverse sm:space-y-0 sm:space-x-4 mt-6">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto gap-2"
                  onClick={() => document.querySelector('[data-value="personal"]')?.click()}
                >
                  <ArrowLeft className="h-4 w-4" /> Anterior
                </Button>
                <Button
                  onClick={() => document.querySelector('[data-value="academico"]')?.click()}
                  className="w-full sm:w-auto"
                >
                  Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Pestaña: Información Académica */}
            <TabsContent value="academico" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="programa">
                    Programa <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={datosAcademicos.programa}
                    onValueChange={(val) => setDatosAcademicos({ ...datosAcademicos, programa: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar programa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mpm">MPM - Master of Project Management</SelectItem>
                      <SelectItem value="bba8">BBA 8</SelectItem>
                      <SelectItem value="bba12">BBA 12</SelectItem>
                      <SelectItem value="bba18">BBA 18</SelectItem>
                      <SelectItem value="bba24">BBA 24</SelectItem>
                      <SelectItem value="bba32">BBA 32</SelectItem>
                      <SelectItem value="maestria9">Maestría 9</SelectItem>
                      <SelectItem value="maestria18">Maestría 18</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duracion">
                    Duración de carrera (meses) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="duracion"
                    type="number"
                    value={datosAcademicos.duracion}
                    onChange={(e) => setDatosAcademicos({ ...datosAcademicos, duracion: e.target.value })}
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ultimo-titulo">
                    Último título obtenido <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={datosAcademicos.ultimoTitulo}
                    onValueChange={(val) => setDatosAcademicos({ ...datosAcademicos, ultimoTitulo: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar título" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diversificado">Diversificado</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="licenciatura">Licenciatura</SelectItem>
                      <SelectItem value="maestria">Maestría</SelectItem>
                      <SelectItem value="doctorado">Doctorado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institucion">
                    Institución donde obtuvo su último título <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="institucion"
                    value={datosAcademicos.institucionAnterior}
                    onChange={(e) => setDatosAcademicos({ ...datosAcademicos, institucionAnterior: e.target.value })}
                    placeholder="Nombre de la institución"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="año-graduacion">
                    Año de graduación <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="año-graduacion"
                    type="number"
                    value={datosAcademicos.añoGraduacion}
                    onChange={(e) => setDatosAcademicos({ ...datosAcademicos, añoGraduacion: e.target.value })}
                    placeholder="Ej. 2020"
                    min="1950"
                    max={new Date().getFullYear()}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modalidad">
                    Modalidad <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={datosAcademicos.modalidad}
                    onValueChange={(val) => setDatosAcademicos({ ...datosAcademicos, modalidad: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sincronica">Sincrónica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha-inicio">
                    Mes de inicio <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={datosAcademicos.fechaInicio}
                    onValueChange={(val) => setDatosAcademicos({ ...datosAcademicos, fechaInicio: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar mes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enero">Enero</SelectItem>
                      <SelectItem value="febrero">Febrero</SelectItem>
                      <SelectItem value="marzo">Marzo</SelectItem>
                      <SelectItem value="abril">Abril</SelectItem>
                      <SelectItem value="mayo">Mayo</SelectItem>
                      <SelectItem value="junio">Junio</SelectItem>
                      <SelectItem value="julio">Julio</SelectItem>
                      <SelectItem value="agosto">Agosto</SelectItem>
                      <SelectItem value="septiembre">Septiembre</SelectItem>
                      <SelectItem value="octubre">Octubre</SelectItem>
                      <SelectItem value="noviembre">Noviembre</SelectItem>
                      <SelectItem value="diciembre">Diciembre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dia-estudio">
                    Día que estudiará <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={datosAcademicos.diaEstudio}
                    onValueChange={(val) => setDatosAcademicos({ ...datosAcademicos, diaEstudio: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar día" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lunes">Lunes</SelectItem>
                      <SelectItem value="martes">Martes</SelectItem>
                      <SelectItem value="miercoles">Miércoles</SelectItem>
                      <SelectItem value="jueves">Jueves</SelectItem>
                      <SelectItem value="viernes">Viernes</SelectItem>
                      <SelectItem value="sabado">Sábado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha-inicio-especifica">
                    Fecha de Inicio Específica <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fecha-inicio-especifica"
                    type="date"
                    value={datosAcademicos.fechaInicioEspecifica}
                    onChange={(e) => setDatosAcademicos({ ...datosAcademicos, fechaInicioEspecifica: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha-taller-induccion">
                    Fecha taller de inducción <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fecha-taller-induccion"
                    type="date"
                    value={datosAcademicos.fechaTallerInduccion}
                    onChange={(e) => setDatosAcademicos({ ...datosAcademicos, fechaTallerInduccion: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha-taller-integracion">
                    Fecha taller de integración <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fecha-taller-integracion"
                    type="date"
                    value={datosAcademicos.fechaTallerIntegracion}
                    onChange={(e) => setDatosAcademicos({ ...datosAcademicos, fechaTallerIntegracion: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medio-conocio">
                    Por qué medio conoció American SM <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={datosAcademicos.medioConocio}
                    onValueChange={(val) => setDatosAcademicos({ ...datosAcademicos, medioConocio: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar opción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="redes">Redes sociales</SelectItem>
                      <SelectItem value="amigo">Recomendación de un amigo</SelectItem>
                      <SelectItem value="empresa">Por medio de mi empresa</SelectItem>
                      <SelectItem value="evento">Evento o feria educativa</SelectItem>
                      <SelectItem value="busqueda">Búsqueda en internet</SelectItem>
                      <SelectItem value="otros">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    value={datosAcademicos.observaciones}
                    onChange={(e) => setDatosAcademicos({ ...datosAcademicos, observaciones: e.target.value })}
                    placeholder="Observaciones adicionales"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cursos-aprobados">Cant. cursos aprobados (especificar, carrera y universidad)</Label>
                  <Input
                    id="cursos-aprobados"
                    value={datosAcademicos.cursosAprobados}
                    onChange={(e) => setDatosAcademicos({ ...datosAcademicos, cursosAprobados: e.target.value })}
                    placeholder="Cantidad de cursos aprobados"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="titulo1">Título 1</Label>
                  <Input
                    id="titulo1"
                    value={datosAcademicos.titulo1}
                    onChange={(e) => setDatosAcademicos({ ...datosAcademicos, titulo1: e.target.value })}
                    placeholder="Primer título"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="titulo2">Título 2</Label>
                  <Input
                    id="titulo2"
                    value={datosAcademicos.titulo2}
                    onChange={(e) => setDatosAcademicos({ ...datosAcademicos, titulo2: e.target.value })}
                    placeholder="Segundo título"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="titulo3">Título 3</Label>
                  <Input
                    id="titulo3"
                    value={datosAcademicos.titulo3}
                    onChange={(e) => setDatosAcademicos({ ...datosAcademicos, titulo3: e.target.value })}
                    placeholder="Tercer título"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-between space-y-4 space-y-reverse sm:space-y-0 sm:space-x-4 mt-6">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto gap-2"
                  onClick={() => document.querySelector('[data-value="laboral"]')?.click()}
                >
                  <ArrowLeft className="h-4 w-4" /> Anterior
                </Button>
                <Button
                  onClick={() => document.querySelector('[data-value="financiero"]')?.click()}
                  className="w-full sm:w-auto"
                >
                  Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Pestaña: Datos Financieros */}
            <TabsContent value="financiero" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="beca">
                    ¿Posee alguna beca? <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={datosFinancieros.beca}
                    onValueChange={(val) => setDatosFinancieros({ ...datosFinancieros, beca: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar opción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="si">Sí</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="porcentaje-beca">Porcentaje de Beca</Label>
                  <Input
                    id="porcentaje-beca"
                    value={datosFinancieros.porcentajeBeca}
                    readOnly
                    disabled={datosFinancieros.beca === "no"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forma-pago">
                    Modalidad de Pago <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={datosFinancieros.formaPago}
                    onValueChange={(val) => setDatosFinancieros({ ...datosFinancieros, formaPago: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar forma de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposito">Depósito Bancario</SelectItem>
                      <SelectItem value="debito">Débito Automático</SelectItem>
                      <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta de Crédito/Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inscripcion">Inscripción (Q)</Label>
                  <Input id="inscripcion" value={datosFinancieros.inscripcion} readOnly />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cuota-mensual">Cuota Mensual (Q)</Label>
                  <Input id="cuota-mensual" value={datosFinancieros.cuotaMensual} readOnly />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cantidad-meses">Cantidad en Meses</Label>
                  <Input id="cantidad-meses" value={datosFinancieros.cantidadMeses} readOnly />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inversion-total">Inversión Total (Q)</Label>
                  <Input id="inversion-total" value={datosFinancieros.inversionTotal} readOnly className="font-bold" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="referencia">¿Cómo se enteró de nosotros?</Label>
                  <Select
                    value={datosFinancieros.referencia}
                    onValueChange={(val) => setDatosFinancieros({ ...datosFinancieros, referencia: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar opción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="redes">Redes sociales</SelectItem>
                      <SelectItem value="amigo">Recomendación de un amigo</SelectItem>
                      <SelectItem value="empresa">Por medio de mi empresa</SelectItem>
                      <SelectItem value="evento">Evento o feria educativa</SelectItem>
                      <SelectItem value="busqueda">Búsqueda en internet</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-blue-50 p-4">
                <h3 className="mb-3 font-semibold text-blue-900">INVERSIÓN ADICIONAL OBLIGATORIA</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-medium text-blue-800">Gastos finales</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 text-left"></th>
                          <th className="py-2 text-left">Pago con transferencia o depósito</th>
                          <th className="py-2 text-left">Otro método de pago</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">Proyecto Final</td>
                          <td className="py-2">Q1,600.00</td>
                          <td className="py-2">Q1,760.00</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Graduación</td>
                          <td className="py-2">Q2,845.00</td>
                          <td className="py-2">Q3,129.50</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Gastos de Título (1)</td>
                          <td className="py-2">Q3,999.00</td>
                          <td className="py-2">Q4,398.90</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Certificación Internacional</td>
                          <td className="py-2">Q2,000.00</td>
                          <td className="py-2">Q2,200.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h4 className="mb-2 font-medium text-blue-800">Servicios Electrónicos</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 text-left"></th>
                          <th className="py-2 text-left">Pago con transferencia o depósito</th>
                          <th className="py-2 text-left">Otro método de pago</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">Programa de 8 Cursos</td>
                          <td className="py-2">Q362.00</td>
                          <td className="py-2">Q398.20</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Programa de 9 Cursos</td>
                          <td className="py-2">Q421.00</td>
                          <td className="py-2">Q463.10</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Programa de 12 Cursos</td>
                          <td className="py-2">Q598.00</td>
                          <td className="py-2">Q657.80</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Programa de 18 Cursos</td>
                          <td className="py-2">Q897.00</td>
                          <td className="py-2">Q986.70</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Programa de 21 Cursos</td>
                          <td className="py-2">Q1,074.00</td>
                          <td className="py-2">Q1,181.40</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Programa de 24 Cursos</td>
                          <td className="py-2">Q1,251.00</td>
                          <td className="py-2">Q1,376.10</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Programa de 32 Cursos</td>
                          <td className="py-2">Q1,650.00</td>
                          <td className="py-2">Q1,815.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-600">
                  <p>
                    * El porcentaje de BECA que obtuvo aplica si se hace a través de déposito/ débito automático/
                    transferencia. (No aplica en otros medios de pago)
                  </p>
                  <p>
                    * La cuota de casos debe cancelarla al inicio de carrera, sin embargo puede cancelar el 50% al
                    inicio y 50 a mediados de carrera.
                  </p>
                  <p>
                    * El título sera emitido hasta culminar satisfactoriamente los cursos requeridos del programa y los
                    pagos efectuados en su totalidad.
                  </p>
                  <p>
                    * Si su título es aceptado o no por otra universidad, depende totalmente de las regulaciones propias
                    del centro de estudio. No ofrecemos Colegiado
                  </p>
                  <p>
                    * Nota: el pago de cuotas se realiza del 01 al 05 de cada mes, a partir del 6 se cargará Q.50.00 por
                    concepto de mora.
                  </p>
                  <p>
                    * Este archivo debe llenarse y enviarse por medio de correo electrónico al departamento comercial y
                    académico.
                  </p>
                  <p>* Cuando es programa de doble titulación debe cancelar doble título</p>
                </div>
              </div>

              <div className="flex items-start space-x-2 mt-4">
                <Checkbox
                  id="terminos"
                  checked={datosFinancieros.aceptaTerminos}
                  onCheckedChange={(checked) =>
                    setDatosFinancieros({
                      ...datosFinancieros,
                      aceptaTerminos: checked as boolean,
                    })
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="terminos"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Acepto los términos y condiciones <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    He leído y acepto los términos y condiciones financieros descritos anteriormente.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-between space-y-4 space-y-reverse sm:space-y-0 sm:space-x-4 mt-6">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto gap-2"
                  onClick={() => document.querySelector('[data-value="academico"]')?.click()}
                >
                  <ArrowLeft className="h-4 w-4" /> Anterior
                </Button>
                <Button
                  onClick={() => document.querySelector('[data-value="documentos"]')?.click()}
                  className="w-full sm:w-auto"
                  disabled={!datosFinancieros.aceptaTerminos}
                >
                  Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Pestaña: Documentos */}
            <TabsContent value="documentos" className="space-y-6">
              <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                <Info className="h-4 w-4" />
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription>
                  Todos los documentos deben estar en formato PDF, JPG o PNG y no deben exceder los 5MB.
                </AlertDescription>
              </Alert>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-blue-900">Documentos Obligatorios</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  {documentos.map((documento) => (
                    <div
                      key={documento.id}
                      className="rounded-lg border p-4 transition-all hover:border-blue-200 hover:bg-blue-50/30"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="font-medium">{documento.nombre}</h4>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            documento.estado === "cargado"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {documento.estado === "cargado" ? "Cargado" : "Pendiente"}
                        </span>
                      </div>
                      <p className="mb-4 text-sm text-gray-600">{documento.descripcion}</p>
                      {documento.estado === "cargado" ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-blue-600" />
                            <span className="text-sm truncate max-w-[150px]">
                              {documento.archivo?.name || "Archivo cargado"}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setDocumentos((prev) =>
                                prev.map((doc) =>
                                  doc.id === documento.id
                                    ? { ...doc, archivo: null, estado: "pendiente" as const }
                                    : doc,
                                ),
                              )
                            }}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full gap-2"
                          onClick={() => {
                            const input = document.createElement("input")
                            input.type = "file"
                            input.accept = ".pdf,.jpg,.jpeg,.png"
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0]
                              if (file) {
                                handleFileUpload(documento.id, file)
                              }
                            }
                            input.click()
                          }}
                        >
                          <Upload className="h-4 w-4" /> Subir Archivo
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-blue-50 p-4">
                <h3 className="mb-3 font-semibold text-blue-900">
                  DOCUMENTOS ADICIONALES REQUERIDOS PARA LOS DISTINTOS PROGRAMAS DE ASM
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left">Programa</th>
                        <th className="py-2 text-left">Fotostática del Título de Diversificado</th>
                        <th className="py-2 text-left">Cierre de Pensum</th>
                        <th className="py-2 text-left">Certificación de Cursos Aprobados</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">BBA 8</td>
                        <td className="py-2">Si</td>
                        <td className="py-2"></td>
                        <td className="py-2">40</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">BBA 12</td>
                        <td className="py-2">Si</td>
                        <td className="py-2"></td>
                        <td className="py-2">30</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">BBA 18</td>
                        <td className="py-2">Si</td>
                        <td className="py-2"></td>
                        <td className="py-2">25</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">BBA 24</td>
                        <td className="py-2">Si</td>
                        <td className="py-2"></td>
                        <td className="py-2">20</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">BBA 32</td>
                        <td className="py-2">Si</td>
                        <td className="py-2"></td>
                        <td className="py-2">Menos de 20</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left">Programa</th>
                        <th className="py-2 text-left">Fotostática del Título de Licenciatura</th>
                        <th className="py-2 text-left">Fotostática del Título de Maestría</th>
                        <th className="py-2 text-left">Cierre de Pensum</th>
                        <th className="py-2 text-left">Certificación con 40 Cursos Aprobados</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">Maestría 9</td>
                        <td className="py-2">Si</td>
                        <td className="py-2"></td>
                        <td className="py-2"></td>
                        <td className="py-2"></td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Maestría 18</td>
                        <td className="py-2">✓</td>
                        <td className="py-2"></td>
                        <td className="py-2"></td>
                        <td className="py-2"></td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Maestría 21</td>
                        <td className="py-2"></td>
                        <td className="py-2"></td>
                        <td className="py-2"></td>
                        <td className="py-2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-between space-y-4 space-y-reverse sm:space-y-0 sm:space-x-4 mt-6">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto gap-2"
                  onClick={() => document.querySelector('[data-value="financiero"]')?.click()}
                >
                  <ArrowLeft className="h-4 w-4" /> Anterior
                </Button>
                <Link href="/inscripcion/revision">
                  <Button className="w-full sm:w-auto" disabled={documentos.some((doc) => doc.estado === "pendiente")}>
                    Guardar y Continuar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-2 gap-8">
        <div className="text-center">
          <div className="h-16 border-b border-dashed border-gray-400 mb-2"></div>
          <p className="text-sm">Eduardo Luis Ramos Lemus</p>
        </div>
        <div className="text-center">
          <div className="h-16 border-b border-dashed border-gray-400 mb-2"></div>
          <p className="text-sm">Jennie Guerra</p>
          <p className="text-xs text-gray-600">Asesor Educativo</p>
        </div>
      </div>
    </div>
  )
}

