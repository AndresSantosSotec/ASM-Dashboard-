"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DownloadIcon, FileTextIcon, CalendarIcon, AlertCircleIcon, CheckCircleIcon, ClockIcon } from "lucide-react"

// Tipos de datos
interface Pago {
  id: string
  fecha: string
  concepto: string
  monto: number
  estado: "pagado" | "pendiente" | "vencido"
  comprobante?: string
  fechaVencimiento?: string
}

interface Curso {
  id: string
  nombre: string
  costo: number
  estado: "activo" | "completado" | "pendiente"
}

interface EstadoCuentaProps {
  estudianteId: string
  nombreEstudiante?: string
}

export function EstadoCuenta({ estudianteId, nombreEstudiante = "Estudiante" }: EstadoCuentaProps) {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("actual")
  const [cargando, setCargando] = useState(false)

  // Datos de ejemplo - En producción estos vendrían de una API
  const pagos: Pago[] = [
    {
      id: "pago-001",
      fecha: "2025-02-05",
      concepto: "Mensualidad Febrero 2025",
      monto: 750,
      estado: "pagado",
      comprobante: "REC-2025-0123",
    },
    {
      id: "pago-002",
      fecha: "2025-03-05",
      concepto: "Mensualidad Marzo 2025",
      monto: 750,
      estado: "pagado",
      comprobante: "REC-2025-0234",
    },
    {
      id: "pago-003",
      fecha: "",
      concepto: "Mensualidad Abril 2025",
      monto: 750,
      estado: "pendiente",
      fechaVencimiento: "2025-04-05",
    },
    {
      id: "pago-004",
      fecha: "",
      concepto: "Mensualidad Mayo 2025",
      monto: 750,
      estado: "pendiente",
      fechaVencimiento: "2025-05-05",
    },
  ]

  const cursos: Curso[] = [
    { id: "curso-001", nombre: "Desarrollo Web Avanzado", costo: 3000, estado: "activo" },
    { id: "curso-002", nombre: "Diseño UX/UI", costo: 2500, estado: "pendiente" },
  ]

  // Cálculos financieros
  const totalPagado = pagos.filter((p) => p.estado === "pagado").reduce((sum, p) => sum + p.monto, 0)
  const totalPendiente = pagos.filter((p) => p.estado === "pendiente").reduce((sum, p) => sum + p.monto, 0)
  const totalVencido = pagos.filter((p) => p.estado === "vencido").reduce((sum, p) => sum + p.monto, 0)

  // Función para descargar estado de cuenta
  const descargarEstadoCuenta = () => {
    setCargando(true)

    // Simulación de descarga - En producción, esto generaría un PDF
    setTimeout(() => {
      setCargando(false)
      // Aquí iría la lógica real de descarga
      alert("Estado de cuenta descargado correctamente")
    }, 1500)
  }

  // Función para obtener el color según el estado del pago
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pagado":
        return "bg-green-100 text-green-800"
      case "pendiente":
        return "bg-yellow-100 text-yellow-800"
      case "vencido":
        return "bg-red-100 text-red-800"
      default:
        return ""
    }
  }

  // Función para obtener el icono según el estado del pago
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "pagado":
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />
      case "pendiente":
        return <ClockIcon className="h-4 w-4 text-yellow-600" />
      case "vencido":
        return <AlertCircleIcon className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Estado de Cuenta</h2>
          <p className="text-muted-foreground">Información financiera de {nombreEstudiante}</p>
        </div>
        <Button onClick={descargarEstadoCuenta} disabled={cargando} className="flex items-center gap-2">
          <DownloadIcon className="h-4 w-4" />
          {cargando ? "Generando..." : "Descargar Estado de Cuenta"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Q {totalPagado.toLocaleString("es-GT")}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Último pago: {pagos.filter((p) => p.estado === "pagado").slice(-1)[0]?.fecha || "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendiente de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Q {totalPendiente.toLocaleString("es-GT")}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Próximo vencimiento: {pagos.filter((p) => p.estado === "pendiente")[0]?.fechaVencimiento || "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pagos Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Q {totalVencido.toLocaleString("es-GT")}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalVencido > 0 ? "Contacte a administración" : "Sin pagos vencidos"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="historial" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3 md:grid-cols-3">
          <TabsTrigger value="historial">Historial de Pagos</TabsTrigger>
          <TabsTrigger value="proximos">Próximos Pagos</TabsTrigger>
          <TabsTrigger value="cursos">Cursos Inscritos</TabsTrigger>
        </TabsList>

        <TabsContent value="historial" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Historial de Pagos</h3>
            <Select value={periodoSeleccionado} onValueChange={setPeriodoSeleccionado}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="actual">Periodo Actual</SelectItem>
                <SelectItem value="6meses">Últimos 6 meses</SelectItem>
                <SelectItem value="anual">Año completo</SelectItem>
                <SelectItem value="todo">Todo el historial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Comprobante</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagos
                    .filter((p) => p.estado === "pagado")
                    .map((pago) => (
                      <TableRow key={pago.id}>
                        <TableCell>{pago.fecha}</TableCell>
                        <TableCell>{pago.concepto}</TableCell>
                        <TableCell>
                          {pago.comprobante ? (
                            <div className="flex items-center gap-1">
                              <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                              {pago.comprobante}
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getEstadoColor(pago.estado)}>
                            <span className="flex items-center gap-1">
                              {getEstadoIcon(pago.estado)}
                              {pago.estado === "pagado"
                                ? "Pagado"
                                : pago.estado === "pendiente"
                                  ? "Pendiente"
                                  : "Vencido"}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">Q {pago.monto.toLocaleString("es-GT")}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proximos" className="space-y-4">
          <h3 className="text-lg font-semibold">Próximos Pagos</h3>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagos
                    .filter((p) => p.estado === "pendiente")
                    .map((pago) => (
                      <TableRow key={pago.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            {pago.fechaVencimiento}
                          </div>
                        </TableCell>
                        <TableCell>{pago.concepto}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getEstadoColor(pago.estado)}>
                            <span className="flex items-center gap-1">
                              {getEstadoIcon(pago.estado)}
                              {pago.estado === "pagado"
                                ? "Pagado"
                                : pago.estado === "pendiente"
                                  ? "Pendiente"
                                  : "Vencido"}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">Q {pago.monto.toLocaleString("es-GT")}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="bg-muted/50 p-3">
              <div className="flex justify-between w-full items-center">
                <span className="text-sm font-medium">Total pendiente:</span>
                <span className="font-bold">Q {totalPendiente.toLocaleString("es-GT")}</span>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="cursos" className="space-y-4">
          <h3 className="text-lg font-semibold">Cursos Inscritos</h3>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cursos.map((curso) => (
                    <TableRow key={curso.id}>
                      <TableCell className="font-medium">{curso.nombre}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            curso.estado === "activo"
                              ? "default"
                              : curso.estado === "completado"
                                ? "outline"
                                : "secondary"
                          }
                        >
                          {curso.estado === "activo"
                            ? "Activo"
                            : curso.estado === "completado"
                              ? "Completado"
                              : "Pendiente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">Q {curso.costo.toLocaleString("es-GT")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

