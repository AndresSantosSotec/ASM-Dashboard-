"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2Icon, DownloadIcon, TrendingUpIcon, BookOpenIcon, AwardIcon } from "lucide-react"
import profileService, { HistorialAcademico, CourseHistoryItem } from "@/services/profile"
import { useToast } from "@/hooks/use-toast"

export function HistorialAcademicoTab() {
  const [loading, setLoading] = useState(true)
  const [historial, setHistorial] = useState<HistorialAcademico | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    cargarHistorial()
  }, [])

  const cargarHistorial = async () => {
    try {
      setLoading(true)
      const data = await profileService.getHistorialAcademico()
      setHistorial(data)
    } catch (error: any) {
      console.error("Error cargando historial académico:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar el historial académico",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const descargarHistorial = () => {
    toast({
      title: "Función en desarrollo",
      description: "La descarga del historial estará disponible pronto"
    })
  }

  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'Aprobado':
        return <Badge variant="default" className="bg-green-500">Aprobado</Badge>
      case 'En curso':
        return <Badge variant="secondary">En curso</Badge>
      case 'Reprobado':
        return <Badge variant="destructive">Reprobado</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!historial) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            No se pudo cargar el historial académico
          </p>
        </CardContent>
      </Card>
    )
  }

  const { resumen, cursos } = historial

  return (
    <div className="space-y-6">
      {/* Resumen Académico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resumen.promedio_general ? resumen.promedio_general.toFixed(1) : '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">Escala 0-100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Aprobados</CardTitle>
            <AwardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen.cursos_aprobados}</div>
            <p className="text-xs text-muted-foreground">
              {resumen.creditos_totales > 0 
                ? `De ${resumen.creditos_totales} créditos totales`
                : 'Cursos completados'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Actuales</CardTitle>
            <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen.cursos_actuales}</div>
            <p className="text-xs text-muted-foreground">En este período</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Historial */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Historial de Cursos</CardTitle>
              <CardDescription>Registro completo de cursos cursados</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={descargarHistorial}>
              <DownloadIcon className="h-4 w-4 mr-2" />
              Descargar Historial
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cursos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No se encontraron cursos registrados
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Fecha Fin</TableHead>
                    <TableHead className="text-right">Calificación</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cursos.map((curso, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{curso.curso}</TableCell>
                      <TableCell>{curso.codigo_curso || '—'}</TableCell>
                      <TableCell>{curso.fecha_inicio || '—'}</TableCell>
                      <TableCell>{curso.fecha_fin || '—'}</TableCell>
                      <TableCell className="text-right">
                        {curso.calificacion !== null && curso.calificacion !== undefined 
                          ? curso.calificacion.toFixed(1) 
                          : '—'
                        }
                      </TableCell>
                      <TableCell className="text-center">
                        {getBadgeEstado(curso.estado)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
