"use client"

/**
 * 🔍 COMPONENTE: Modal Detalle Estudiante
 * 
 * Modal con información financiera detallada de un estudiante
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, User, Mail, Phone, GraduationCap, DollarSign } from "lucide-react"
import { useEstudianteFinanciero } from "@/hooks/useFinancialMetrics"
import { formatCurrency, getEstadoDescripcion, getEstadoColor } from "@/services/financialMetrics"

interface DetalleEstudianteModalProps {
  carnet: string
  mes: number
  anio: number
  open: boolean
  onClose: () => void
}

export function DetalleEstudianteModal({
  carnet,
  mes,
  anio,
  open,
  onClose,
}: DetalleEstudianteModalProps) {
  const { estudiante, isLoading, isError } = useEstudianteFinanciero(carnet, mes, anio)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalle Financiero - {carnet}
          </DialogTitle>
          <DialogDescription>
            Estado financiero completo para {mes}/{anio}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {isError && (
          <div className="text-center py-10 text-destructive">
            Error al cargar datos del estudiante
          </div>
        )}

        {estudiante && (
          <div className="space-y-6">
            {/* Información básica */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información del Estudiante</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{estudiante.nombre_completo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{estudiante.correo || "Sin correo"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{estudiante.telefono || "Sin teléfono"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{estudiante.total_cursos} cursos activos en Moodle</span>
                </div>
              </CardContent>
            </Card>

            {/* Resumen financiero */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen Financiero</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Deuda</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(estudiante.total_deuda)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pagado</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(estudiante.total_pagado)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mora Total</p>
                    <p className="text-xl font-bold text-orange-600">
                      {formatCurrency(estudiante.mora_total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado General</p>
                    <Badge
                      className="mt-1"
                      style={{
                        backgroundColor: `var(--${getEstadoColor(estudiante.estado_general)})`,
                      }}
                    >
                      {getEstadoDescripcion(estudiante.estado_general)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Desglose por programa */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Desglose por Programa</CardTitle>
                <CardDescription>
                  Detalle financiero de cada programa activo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {estudiante.programas.map((programa) => (
                  <div key={programa.programa_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{programa.nombre_programa}</h4>
                        <p className="text-sm text-muted-foreground">
                          {programa.cursos_moodle} cursos • Q{programa.cuota_base} por curso
                        </p>
                      </div>
                      <Badge
                        style={{
                          backgroundColor: `var(--${getEstadoColor(programa.estado)})`,
                        }}
                      >
                        {getEstadoDescripcion(programa.estado)}
                      </Badge>
                    </div>

                    <Separator className="my-3" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Cuota Real</p>
                        <p className="text-sm font-bold">
                          {formatCurrency(programa.cuota_real)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pagado</p>
                        <p className="text-sm font-bold text-green-600">
                          {formatCurrency(programa.total_pagado)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Mora</p>
                        <p className="text-sm font-bold text-orange-600">
                          {formatCurrency(programa.mora)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Saldo</p>
                        <p className="text-sm font-bold text-red-600">
                          {formatCurrency(programa.saldo_pendiente)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Información adicional */}
            {estudiante.primera_matricula && (
              <Card>
                <CardContent className="py-4">
                  <p className="text-sm text-muted-foreground">
                    Primera matrícula en Moodle:{" "}
                    <span className="font-medium text-foreground">
                      {new Date(estudiante.primera_matricula).toLocaleDateString()}
                    </span>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
