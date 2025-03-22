import { Header } from "@/components/header"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { es } from "date-fns/locale"
import { Search, Plus, Edit, FileText, CalendarIcon, Clock, CheckCircle, XCircle } from "lucide-react"

export default function PeriodosInscripcionPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Administración de Periodos de Inscripción" />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold">Periodos de Inscripción</h1>
            <p className="text-sm text-muted-foreground">
              Gestione los periodos de inscripción para los diferentes programas académicos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar periodo..." className="pl-8 w-[250px]" />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-1">
                  <Plus className="h-4 w-4" />
                  Nuevo Periodo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Periodo de Inscripción</DialogTitle>
                  <DialogDescription>
                    Configure las fechas y programas para el nuevo periodo de inscripción.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre del Periodo *</Label>
                      <Input id="nombre" placeholder="Ej: Primavera 2023" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codigo">Código *</Label>
                      <Input id="codigo" placeholder="Ej: PRIM-2023" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha de Inicio *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            15/01/2023
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" locale={es} showOutsideDays={false} className="rounded-md border" />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de Fin *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            15/03/2023
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" locale={es} showOutsideDays={false} className="rounded-md border" />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="programas">Programas Aplicables *</Label>
                    <Select>
                      <SelectTrigger id="programas">
                        <SelectValue placeholder="Seleccionar programas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los Programas</SelectItem>
                        <SelectItem value="maestrias">Todas las Maestrías</SelectItem>
                        <SelectItem value="diplomados">Todos los Diplomados</SelectItem>
                        <SelectItem value="especificos">Programas Específicos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Input id="descripcion" placeholder="Descripción del periodo de inscripción..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cupos">Cupos Disponibles *</Label>
                      <Input id="cupos" type="number" min="1" placeholder="Ej: 100" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descuento">Descuento por Inscripción Temprana (%)</Label>
                      <Input id="descuento" type="number" min="0" max="100" placeholder="Ej: 10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Configuración Adicional</Label>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="activo" className="cursor-pointer">
                          Periodo Activo
                        </Label>
                        <Switch id="activo" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="visible" className="cursor-pointer">
                          Visible en Portal Público
                        </Label>
                        <Switch id="visible" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="notificaciones" className="cursor-pointer">
                          Enviar Notificaciones
                        </Label>
                        <Switch id="notificaciones" defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancelar</Button>
                  <Button>Guardar Periodo</Button>
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
                  <TableHead>Nombre del Periodo</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Programas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cupos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    nombre: "Primavera 2023",
                    inicio: "15/01/2023",
                    fin: "15/03/2023",
                    programas: "Todos",
                    estado: "Activo",
                    cupos: "100/150",
                    porcentaje: 67,
                  },
                  {
                    nombre: "Verano 2023",
                    inicio: "01/05/2023",
                    fin: "30/06/2023",
                    programas: "Maestrías",
                    estado: "Próximo",
                    cupos: "0/80",
                    porcentaje: 0,
                  },
                  {
                    nombre: "Otoño 2023",
                    inicio: "15/08/2023",
                    fin: "15/10/2023",
                    programas: "Todos",
                    estado: "Próximo",
                    cupos: "0/120",
                    porcentaje: 0,
                  },
                  {
                    nombre: "Invierno 2022",
                    inicio: "01/11/2022",
                    fin: "31/12/2022",
                    programas: "Diplomados",
                    estado: "Finalizado",
                    cupos: "75/75",
                    porcentaje: 100,
                  },
                  {
                    nombre: "Especial MBA 2023",
                    inicio: "01/02/2023",
                    fin: "28/02/2023",
                    programas: "MBA Ejecutivo",
                    estado: "Finalizado",
                    cupos: "30/30",
                    porcentaje: 100,
                  },
                ].map((periodo, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{periodo.nombre}</TableCell>
                    <TableCell>{periodo.inicio}</TableCell>
                    <TableCell>{periodo.fin}</TableCell>
                    <TableCell>{periodo.programas}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          periodo.estado === "Activo"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : periodo.estado === "Próximo"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }
                      >
                        {periodo.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{periodo.cupos}</div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${
                              periodo.porcentaje >= 90
                                ? "bg-red-500"
                                : periodo.porcentaje >= 60
                                  ? "bg-amber-500"
                                  : "bg-green-500"
                            }`}
                            style={{ width: `${periodo.porcentaje}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
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
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Detalles del Periodo</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">Nombre</h3>
                                  <p>{periodo.nombre}</p>
                                </div>
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">Código</h3>
                                  <p>{periodo.nombre === "Primavera 2023" ? "PRIM-2023" : "VER-2023"}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">Fecha de Inicio</h3>
                                  <p>{periodo.inicio}</p>
                                </div>
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">Fecha de Fin</h3>
                                  <p>{periodo.fin}</p>
                                </div>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-gray-500">Programas Aplicables</h3>
                                <p>{periodo.programas}</p>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
                                <p className="text-sm text-gray-700">
                                  {periodo.nombre === "Primavera 2023"
                                    ? "Periodo regular de inscripciones para todos los programas académicos del primer semestre del año 2023."
                                    : "Periodo especial de inscripciones para programas de maestría durante el verano de 2023."}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">Cupos</h3>
                                  <p>{periodo.cupos}</p>
                                </div>
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">Ocupación</h3>
                                  <p>{periodo.porcentaje}%</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">
                                    Descuento por Inscripción Temprana
                                  </h3>
                                  <p>{i % 2 === 0 ? "10%" : "5%"}</p>
                                </div>
                                <div>
                                  <h3 className="text-sm font-medium text-gray-500">Visible en Portal</h3>
                                  <p>{periodo.estado !== "Finalizado" ? "Sí" : "No"}</p>
                                </div>
                              </div>
                              {periodo.estado === "Activo" && (
                                <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span className="font-medium">Tiempo Restante:</span>
                                  </div>
                                  <p className="mt-1">15 días para finalizar el periodo de inscripción</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        {periodo.estado !== "Finalizado" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={periodo.estado === "Activo" ? "text-red-500" : "text-green-500"}
                          >
                            {periodo.estado === "Activo" ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            <span className="sr-only">{periodo.estado === "Activo" ? "Desactivar" : "Activar"}</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <div className="text-sm text-muted-foreground">Mostrando 5 de 5 periodos</div>
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

