"use client"

/**
 * 📋 COMPONENTE: Tabla de Pagos Estudiantes
 * 
 * Tabla paginada con estados financieros de estudiantes
 */

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics"
import { formatCurrency, getEstadoColor, getEstadoDescripcion } from "@/services/financialMetrics"
import type { EstadoFinanciero } from "@/services/financialMetrics"

interface TablaPagosEstudiantesProps {
  mes: number
  anio: number
  onVerDetalle: (carnet: string) => void
}

export function TablaPagosEstudiantes({ mes, anio, onVerDetalle }: TablaPagosEstudiantesProps) {
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [paginaActual, setPaginaActual] = useState(1)
  const itemsPorPagina = 10

  const { metrics, isLoading } = useFinancialMetrics({ mes, anio })

  // TODO: Obtener lista real de estudiantes desde backend
  // Por ahora usamos datos mock
  const estudiantes = metrics
    ? Array.from({ length: 50 }, (_, i) => ({
        carnet: `asm202200${100 + i}`,
        nombre: `Estudiante ${i + 1}`,
        programa: metrics.por_programa[i % metrics.por_programa.length]?.nombre || "BBA",
        deuda: Math.random() * 1000,
        pagado: Math.random() * 800,
        mora: Math.random() > 0.7 ? 50 : 0,
        estado: [
          "PAGADO_COMPLETO",
          "PAGO_PARCIAL",
          "MOROSO",
          "SIN_PAGO",
        ][Math.floor(Math.random() * 4)] as EstadoFinanciero,
      }))
    : []

  // Filtrar estudiantes
  const estudiantesFiltrados = estudiantes.filter((e) => {
    const matchBusqueda =
      e.carnet.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const matchEstado = filtroEstado === "todos" || e.estado === filtroEstado
    return matchBusqueda && matchEstado
  })

  // Paginación
  const totalPaginas = Math.ceil(estudiantesFiltrados.length / itemsPorPagina)
  const inicio = (paginaActual - 1) * itemsPorPagina
  const fin = inicio + itemsPorPagina
  const estudiantesPaginados = estudiantesFiltrados.slice(inicio, fin)

  const getEstadoBadgeVariant = (
    estado: EstadoFinanciero
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (estado) {
      case "PAGADO_COMPLETO":
        return "default"
      case "PAGO_PARCIAL":
        return "secondary"
      case "MOROSO":
      case "MOROSO_CON_ABONO":
        return "destructive"
      default:
        return "outline"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Cargando estudiantes...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estados Financieros por Estudiante</CardTitle>
        <CardDescription>
          Listado completo de estudiantes con su estado de pago actual
        </CardDescription>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por carnet o nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="PAGADO_COMPLETO">Pagado completo</SelectItem>
              <SelectItem value="PAGO_PARCIAL">Pago parcial</SelectItem>
              <SelectItem value="MOROSO">Moroso</SelectItem>
              <SelectItem value="SIN_PAGO">Sin pago</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Carnet</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Programa</TableHead>
              <TableHead className="text-right">Deuda</TableHead>
              <TableHead className="text-right">Pagado</TableHead>
              <TableHead className="text-right">Mora</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estudiantesPaginados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  No se encontraron estudiantes
                </TableCell>
              </TableRow>
            ) : (
              estudiantesPaginados.map((estudiante) => (
                <TableRow key={estudiante.carnet}>
                  <TableCell className="font-mono text-sm">{estudiante.carnet}</TableCell>
                  <TableCell className="font-medium">{estudiante.nombre}</TableCell>
                  <TableCell>{estudiante.programa}</TableCell>
                  <TableCell className="text-right">{formatCurrency(estudiante.deuda)}</TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatCurrency(estudiante.pagado)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {estudiante.mora > 0 ? formatCurrency(estudiante.mora) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getEstadoBadgeVariant(estudiante.estado)}>
                      {getEstadoDescripcion(estudiante.estado)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onVerDetalle(estudiante.carnet)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {inicio + 1}-{Math.min(fin, estudiantesFiltrados.length)} de{" "}
              {estudiantesFiltrados.length} estudiantes
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Página {paginaActual} de {totalPaginas}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
