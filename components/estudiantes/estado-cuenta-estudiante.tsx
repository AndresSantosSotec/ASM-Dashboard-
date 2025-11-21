"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, AlertCircle, Loader2, DollarSign, CreditCard, Calendar, TrendingUp } from "lucide-react"
import { paymentsService, type AccountSummary } from "@/services/payments"
import StudentAccountModal from "../finanzas/StudentAccountModal"
import { generateDetailedAccountStatePDF } from "@/lib/pdf-generator"
import { toast } from "@/hooks/use-toast"
import api from "@/services/api"

export function EstadoCuentaEstudiante() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [prospectoId, setProspectoId] = useState<number | null>(null)

  useEffect(() => {
    loadEstadoCuenta()
  }, [])

  const loadEstadoCuenta = async () => {
    try {
      setLoading(true)
      setError(null)

      // El endpoint /estudiante/pagos/estado-cuenta ya filtra por el usuario autenticado
      const summary = await paymentsService.getAccountStatement()
      setAccountSummary(summary)

      // Extraer el prospecto_id del primer item de cuotas si existe
      if (summary?.cuotas && summary.cuotas.length > 0) {
        const firstCuota = summary.cuotas[0]
        if (firstCuota?.estudiante_programa?.prospecto_id) {
          setProspectoId(firstCuota.estudiante_programa.prospecto_id)
        }
      }

    } catch (err: any) {
      console.error('Error cargando estado de cuenta:', err)
      setError(err.message || 'Error al cargar el estado de cuenta')
      toast({
        title: "Error",
        description: err.message || "No se pudo cargar el estado de cuenta",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePDF = async () => {
    if (!accountSummary) return

    try {
      // Obtener datos completos del estado de cuenta
      const [pendingRes, historyRes] = await Promise.all([
        api.get('/estudiante/pagos/pendientes').catch(() => ({ data: { pagos: [] } })),
        api.get('/estudiante/pagos/historial').catch(() => ({ data: { historial_pagos: [] } }))
      ])

      const pendingPayments = pendingRes.data?.pagos || []
      const paymentHistory = historyRes.data?.historial_pagos || []

      // Obtener información del estudiante desde la primera cuota (para evitar error de propiedad inexistente)
      const prospecto = accountSummary.cuotas?.[0]?.estudiante_programa?.prospecto

      const studentName = prospecto?.nombre_completo || 'Estudiante'
      const studentCarnet = prospecto?.carnet || ''

      const studentEmail = prospecto?.correo_electronico || ''

      // Convertir datos al formato AccountData
      const accountData = {
        student: {
          id: prospecto?.id || prospectoId || 0,
          name: studentName,
          carnet: studentCarnet,
          email: studentEmail
        },
        balance: {
          isBlocked: (accountSummary.resumen?.monto_pendiente || 0) > 0,
          warningLevel: ((accountSummary.resumen?.monto_pendiente || 0) > 1000 ? 2 : 
                       (accountSummary.resumen?.monto_pendiente || 0) > 500 ? 1 : 0) as 0 | 1 | 2,
          nextDueDate: pendingPayments.length > 0 ? pendingPayments[0]?.fecha_vencimiento : null,
          daysUntilDue: pendingPayments.length > 0 && pendingPayments[0]?.fecha_vencimiento ? 
            Math.ceil((new Date(pendingPayments[0].fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
          latePayments: pendingPayments.filter((p: any) => {
            const dueDate = new Date(p.fecha_vencimiento)
            return dueDate < new Date()
          }).length
        },
        pendingPayments: pendingPayments.map((p: any) => ({
          id: p.id,
          concept: `Cuota ${p.numero_cuota} - ${p.estudiante_programa?.programa?.nombre_del_programa || ''}`,
          amount: parseFloat(p.monto || 0),
          lateFee: parseFloat(p.late_fee_total || 0),
          dueDate: p.fecha_vencimiento,
          status: new Date(p.fecha_vencimiento) < new Date() ? 'vencido' as const : 'pendiente' as const,
          daysLate: new Date(p.fecha_vencimiento) < new Date() ? 
            Math.ceil((new Date().getTime() - new Date(p.fecha_vencimiento).getTime()) / (1000 * 60 * 60 * 24)) : null
        })),
        paymentHistory: paymentHistory.map((h: any) => ({
          id: h.id,
          concept: `Cuota ${h.cuota?.numero_cuota || ''} - ${h.estudiante_programa?.programa?.nombre_del_programa || ''}`,
          amount: parseFloat(h.monto_pagado || 0),
          paymentDate: h.fecha_pago,
          method: h.metodo_pago || 'Transferencia',
          reference: h.numero_boleta || h.banco || 'N/A'
        }))
      }

      await generateDetailedAccountStatePDF(accountData)
      toast({
        title: "PDF Generado",
        description: "El estado de cuenta se ha descargado correctamente"
      })
    } catch (error: any) {
      console.error('Error generando PDF:', error)
      toast({
        title: "Error",
        description: error.message || "Error al generar el PDF",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando estado de cuenta...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadEstadoCuenta} 
            className="ml-4"
          >
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!accountSummary) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No se encontró información del estado de cuenta
        </AlertDescription>
      </Alert>
    )
  }

  const totalCobrado = accountSummary?.resumen?.monto_total || 0
  const totalPagado = accountSummary?.resumen?.monto_pagado || 0
  const balance = accountSummary?.resumen?.monto_pendiente || 0
  const cuotasPendientes = accountSummary?.resumen?.cuotas_pendientes || 0
  const cuotasPagadas = accountSummary?.resumen?.cuotas_pagadas || 0

  return (
    <>
      <div className="space-y-6">
        {/* Header con botón de descarga */}
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  Resumen Financiero
                </h2>
                <p className="text-sm text-muted-foreground">
                  Información actualizada de tu cuenta estudiantil
                </p>
              </div>
              <Button onClick={handleGeneratePDF} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumen financiero en cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total a Cobrar</p>
                  <p className="text-2xl font-bold">
                    Q{totalCobrado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pagado</p>
                  <p className="text-2xl font-bold text-green-600">
                    Q{totalPagado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Balance Pendiente</p>
                  <p className={`text-2xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    Q{balance.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingUp className={`w-8 h-8 ${balance > 0 ? 'text-red-500' : 'text-green-500'}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cuotas</p>
                  <p className="text-2xl font-bold">
                    {cuotasPagadas} / {cuotasPendientes + cuotasPagadas}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cuotasPendientes} pendientes
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estado de cuenta */}
        {balance > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Tienes un balance pendiente de <strong>Q{balance.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</strong>. 
              Por favor realiza tu pago para mantener tu cuenta al día.
            </AlertDescription>
          </Alert>
        )}

        {balance === 0 && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              ¡Excelente! Tu cuenta está al día. No tienes pagos pendientes.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabla de detalle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Detalle de Estado de Cuenta</span>
              {prospectoId && (
                <Button 
                  onClick={() => setModalOpen(true)} 
                  variant="outline"
                  size="sm"
                >
                  Ver Detalle Completo
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Total a Cobrar</TableCell>
                  <TableCell className="text-right font-mono">
                    Q{totalCobrado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-green-600">Total Pagado</TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    Q{totalPagado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
                <TableRow className="border-t-2">
                  <TableCell className="font-bold">Balance Pendiente</TableCell>
                  <TableCell className={`text-right font-mono font-bold text-lg ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    Q{balance.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle>Información Importante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Los pagos deben realizarse antes de la fecha de vencimiento para evitar recargos.</p>
            <p>• Puedes realizar tus pagos en la sección de "Gestión de Pagos".</p>
            <p>• Si tienes dudas sobre tu estado de cuenta, contacta al departamento de finanzas.</p>
            <p>• Este estado de cuenta se actualiza automáticamente al registrar pagos.</p>
          </CardContent>
        </Card>
      </div>

      {prospectoId && (
        <StudentAccountModal 
          open={modalOpen} 
          onOpenChange={setModalOpen} 
          prospectoId={prospectoId} 
        />
      )}
    </>
  )
}
