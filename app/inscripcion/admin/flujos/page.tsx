import { Header } from "@/components/header"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Plus,
  Edit,
  FileText,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Users,
  FileSignature,
  FileCheck,
} from "lucide-react"

export default function FlujosAprobacionPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Administración de Flujos de Aprobación" />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold">Flujos de Aprobación</h1>
            <p className="text-sm text-muted-foreground">
              Configure los flujos de aprobación para los procesos de inscripción
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar flujo..." className="pl-8 w-[250px]" />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-1">
                  <Plus className="h-4 w-4" />
                  Nuevo Flujo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Flujo de Aprobación</DialogTitle>
                  <DialogDescription>
                    Configure las etapas y aprobadores para el nuevo flujo de aprobación.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre del Flujo *</Label>
                      <Input id="nombre" placeholder="Ej: Inscripción Estándar" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codigo">Código *</Label>
                      <Input id="codigo" placeholder="Ej: FLUJO-EST" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea id="descripcion" placeholder="Descripción del flujo de aprobación..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aplicable">Aplicable a</Label>
                    <Select>
                      <SelectTrigger id="aplicable">
                        <SelectValue placeholder="Seleccionar aplicación" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los Programas</SelectItem>
                        <SelectItem value="maestrias">Maestrías</SelectItem>
                        <SelectItem value="diplomados">Diplomados</SelectItem>
                        <SelectItem value="especificos">Programas Específicos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Etapas de Aprobación</Label>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Plus className="h-3 w-3" />
                        Agregar Etapa
                      </Button>
                    </div>

                    <Card className="border-dashed">
                      <CardHeader className="p-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Etapa 1: Aprobación Comercial</CardTitle>
                          <Badge>Obligatoria</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-2 pt-0">
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label htmlFor="rol1" className="text-xs">
                                Rol Aprobador
                              </Label>
                              <Select>
                                <SelectTrigger id="rol1">
                                  <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="director-comercial">Director Comercial</SelectItem>
                                  <SelectItem value="coordinador-ventas">Coordinador de Ventas</SelectItem>
                                  <SelectItem value="asesor-senior">Asesor Senior</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="tiempo1" className="text-xs">
                                Tiempo Máximo (horas)
                              </Label>
                              <Input id="tiempo1" type="number" min="1" placeholder="24" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="notificar1" className="text-xs cursor-pointer">
                              Notificar al solicitante
                            </Label>
                            <Switch id="notificar1" defaultChecked />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-dashed">
                      <CardHeader className="p-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Etapa 2: Aprobación Financiera</CardTitle>
                          <Badge>Obligatoria</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-2 pt-0">
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label htmlFor="rol2" className="text-xs">
                                Rol Aprobador
                              </Label>
                              <Select>
                                <SelectTrigger id="rol2">
                                  <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="director-finanzas">Director de Finanzas</SelectItem>
                                  <SelectItem value="contador">Contador</SelectItem>
                                  <SelectItem value="analista-financiero">Analista Financiero</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="tiempo2" className="text-xs">
                                Tiempo Máximo (horas)
                              </Label>
                              <Input id="tiempo2" type="number" min="1" placeholder="48" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="notificar2" className="text-xs cursor-pointer">
                              Notificar al solicitante
                            </Label>
                            <Switch id="notificar2" defaultChecked />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-dashed">
                      <CardHeader className="p-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Etapa 3: Aprobación Académica</CardTitle>
                          <Badge>Obligatoria</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-2 pt-0">
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label htmlFor="rol3" className="text-xs">
                                Rol Aprobador
                              </Label>
                              <Select>
                                <SelectTrigger id="rol3">
                                  <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="director-academico">Director Académico</SelectItem>
                                  <SelectItem value="coordinador-programa">Coordinador de Programa</SelectItem>
                                  <SelectItem value="comite-admisiones">Comité de Admisiones</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="tiempo3" className="text-xs">
                                Tiempo Máximo (horas)
                              </Label>
                              <Input id="tiempo3" type="number" min="1" placeholder="72" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="notificar3" className="text-xs cursor-pointer">
                              Notificar al solicitante
                            </Label>
                            <Switch id="notificar3" defaultChecked />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <Label>Configuración Adicional</Label>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="activo" className="cursor-pointer">
                          Flujo Activo
                        </Label>
                        <Switch id="activo" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="paralelo" className="cursor-pointer">
                          Aprobaciones en Paralelo
                        </Label>
                        <Switch id="paralelo" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-escalamiento" className="cursor-pointer">
                          Auto-escalamiento por Tiempo
                        </Label>
                        <Switch id="auto-escalamiento" defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancelar</Button>
                  <Button>Guardar Flujo</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Flujo</TableHead>
                  <TableHead>Aplicable a</TableHead>
                  <TableHead>Etapas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tiempo Promedio</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    nombre: "Inscripción Estándar",
                    aplicable: "Todos los Programas",
                    etapas: 3,
                    estado: "Activo",
                    tiempo: "48 horas",
                  },
                  {
                    nombre: "Inscripción Maestrías",
                    aplicable: "Maestrías",
                    etapas: 4,
                    estado: "Activo",
                    tiempo: "72 horas",
                  },
                  {
                    nombre: "Inscripción Diplomados",
                    aplicable: "Diplomados",
                    etapas: 2,
                    estado: "Activo",
                    tiempo: "24 horas",
                  },
                  {
                    nombre: "Inscripción Becados",
                    aplicable: "Programas Específicos",
                    etapas: 5,
                    estado: "Inactivo",
                    tiempo: "96 horas",
                  },
                  {
                    nombre: "Inscripción Rápida",
                    aplicable: "Cursos Cortos",
                    etapas: 1,
                    estado: "Activo",
                    tiempo: "12 horas",
                  },
                ].map((flujo, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{flujo.nombre}</TableCell>
                    <TableCell>{flujo.aplicable}</TableCell>
                    <TableCell>{flujo.etapas}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          flujo.estado === "Activo"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }
                      >
                        {flujo.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>{flujo.tiempo}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">Ver detalles</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Detalles del Flujo de Aprobación</DialogTitle>
                              <DialogDescription>
                                {flujo.nombre} - {flujo.aplicable}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">Nombre</h3>
                                  <p>{flujo.nombre}</p>
                                </div>
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">Código</h3>
                                  <p>{flujo.nombre === "Inscripción Estándar" ? "FLUJO-EST" : "FLUJO-MAE"}</p>
                                </div>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
                                <p className="text-sm text-gray-700">
                                  {flujo.nombre === "Inscripción Estándar"
                                    ? "Flujo de aprobación estándar para todos los programas académicos. Incluye aprobaciones comercial, financiera y académica."
                                    : "Flujo de aprobación específico para programas de maestría. Incluye aprobaciones adicionales del comité académico."}
                                </p>
                              </div>

                              <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Diagrama de Flujo</h3>
                                <div className="rounded-md border p-4">
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                                        <Users className="h-5 w-5" />
                                      </div>
                                      <div className="text-sm font-medium">Solicitud de Inscripción</div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-gray-400" />
                                    <div className="flex items-center gap-2">
                                      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                                        <CheckCircle className="h-5 w-5" />
                                      </div>
                                      <div className="text-sm font-medium">Aprobación Comercial</div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-gray-400" />
                                    <div className="flex items-center gap-2">
                                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                                        <CheckCircle className="h-5 w-5" />
                                      </div>
                                      <div className="text-sm font-medium">Aprobación Financiera</div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-gray-400" />
                                    <div className="flex items-center gap-2">
                                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                                        <CheckCircle className="h-5 w-5" />
                                      </div>
                                      <div className="text-sm font-medium">Aprobación Académica</div>
                                    </div>
                                    {flujo.nombre === "Inscripción Maestrías" && (
                                      <>
                                        <ArrowRight className="h-5 w-5 text-gray-400" />
                                        <div className="flex items-center gap-2">
                                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-700">
                                            <CheckCircle className="h-5 w-5" />
                                          </div>
                                          <div className="text-sm font-medium">Aprobación Comité</div>
                                        </div>
                                      </>
                                    )}
                                    <ArrowRight className="h-5 w-5 text-gray-400" />
                                    <div className="flex items-center gap-2">
                                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                                        <FileSignature className="h-5 w-5" />
                                      </div>
                                      <div className="text-sm font-medium">Firma de Contrato</div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-gray-400" />
                                    <div className="flex items-center gap-2">
                                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                                        <FileCheck className="h-5 w-5" />
                                      </div>
                                      <div className="text-sm font-medium">Inscripción Completada</div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Detalles de Etapas</h3>
                                <div className="space-y-3">
                                  <div className="rounded-md border p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="font-medium">Etapa 1: Aprobación Comercial</div>
                                      <Badge>Obligatoria</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="text-gray-500">Rol Aprobador:</span> Director Comercial
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Tiempo Máximo:</span> 24 horas
                                      </div>
                                    </div>
                                  </div>

                                  <div className="rounded-md border p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="font-medium">Etapa 2: Aprobación Financiera</div>
                                      <Badge>Obligatoria</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="text-gray-500">Rol Aprobador:</span> Director de Finanzas
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Tiempo Máximo:</span> 48 horas
                                      </div>
                                    </div>
                                  </div>

                                  <div className="rounded-md border p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="font-medium">Etapa 3: Aprobación Académica</div>
                                      <Badge>Obligatoria</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="text-gray-500">Rol Aprobador:</span> Director Académico
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Tiempo Máximo:</span> 72 horas
                                      </div>
                                    </div>
                                  </div>

                                  {flujo.nombre === "Inscripción Maestrías" && (
                                    <div className="rounded-md border p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="font-medium">Etapa 4: Aprobación Comité</div>
                                        <Badge>Obligatoria</Badge>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <span className="text-gray-500">Rol Aprobador:</span> Comité de Admisiones
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Tiempo Máximo:</span> 96 horas
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">Aprobaciones en Paralelo</h3>
                                  <p>{flujo.nombre === "Inscripción Rápida" ? "Sí" : "No"}</p>
                                </div>
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">Auto-escalamiento</h3>
                                  <p>Sí, después de 24 horas</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={flujo.estado === "Activo" ? "text-red-500" : "text-green-500"}
                        >
                          {flujo.estado === "Activo" ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          <span className="sr-only">{flujo.estado === "Activo" ? "Desactivar" : "Activar"}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <div className="text-sm text-muted-foreground">Mostrando 5 de 5 flujos</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled>
                Siguiente
              </Button>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
