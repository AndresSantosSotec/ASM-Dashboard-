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

      // 🔥 CORRECCIÓN: El backend devuelve `prospecto` a nivel raíz de la respuesta
      // También intentamos desde cuotas por compatibilidad
      const prospectoRaiz = (accountSummary as any)?.prospecto
      const prospectoCuota = accountSummary.cuotas?.[0]?.estudiante_programa?.prospecto
      const prospecto = prospectoRaiz || prospectoCuota

      const studentName = prospecto?.nombre_completo || 'Estudiante'
      const studentCarnet = prospecto?.carnet || ''
      
      // 🔥 CORRECCIÓN: Buscar email en el prospecto correcto
      const studentEmail = prospectoRaiz?.correo_electronico 
        || prospectoCuota?.correo_electronico 
        || prospecto?.correo 
        || prospecto?.email 
        || ''

      // 🔥 CORRECCIÓN: Ordenar historial por fecha descendente (más reciente primero)
      const sortedHistory = [...paymentHistory].sort((a: any, b: any) => {
        const dateA = new Date(a.fecha_pago || 0).getTime()
        const dateB = new Date(b.fecha_pago || 0).getTime()
        return dateB - dateA // Descendente: más reciente primero
      })

      // 🔥 CORRECCIÓN: Ordenar pagos pendientes por fecha de vencimiento ascendente (próximo a vencer primero)
      const sortedPending = [...pendingPayments].sort((a: any, b: any) => {
        const dateA = new Date(a.fecha_vencimiento || 0).getTime()
        const dateB = new Date(b.fecha_vencimiento || 0).getTime()
        return dateA - dateB // Ascendente: próximo a vencer primero
      })

      // ✅ CORRECCIÓN: Usar isBlocked y warningLevel del backend (ya calculados correctamente)
      // Convertir datos al formato AccountData
      const accountData = {
        student: {
          id: prospecto?.id || prospectoId || 0,
          name: studentName,
          carnet: studentCarnet,
          email: studentEmail,
          moneda: (prospecto?.moneda ?? (accountSummary as any)?.prospecto?.moneda ?? 'GTQ') as 'GTQ' | 'USD',
        },
        balance: {
          isBlocked: accountSummary.resumen?.is_blocked ?? false, // ✅ Del backend
          warningLevel: (accountSummary.resumen?.warning_level ?? 0) as 0 | 1 | 2, // ✅ Del backend
          nextDueDate: sortedPending.length > 0 ? sortedPending[0]?.fecha_vencimiento : null,
          daysUntilDue: sortedPending.length > 0 && sortedPending[0]?.fecha_vencimiento ? 
            Math.ceil((new Date(sortedPending[0].fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
          latePayments: sortedPending.filter((p: any) => {
            const dueDate = new Date(p.fecha_vencimiento)
            // ✅ Considerar vencido solo si tiene 4+ días de atraso
            const diasAtraso = Math.ceil((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
            return diasAtraso >= 4
          }).length,
          totalMora: accountSummary.resumen?.total_mora ?? 0, // ✅ Incluir mora
          totalPendiente: accountSummary.resumen?.monto_pendiente ?? 0, // ✅ Total sin mora
          totalConMora: accountSummary.resumen?.total_con_mora ?? 0 // ✅ Total con mora
        },
        // 🔥 MEJORADO: Incluir nombre del programa en concepto
        pendingPayments: sortedPending.map((p: any) => {
          const programName = p.estudiante_programa?.programa?.abreviatura 
            || p.estudiante_programa?.programa?.nombre_del_programa 
            || ''
          const dueDate = new Date(p.fecha_vencimiento)
          const diasAtraso = Math.ceil((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          // ✅ CORRECCIÓN: Solo marcar como vencido si tiene 4+ días de atraso
          const isOverdue = diasAtraso >= 4
          
          return {
            id: p.id,
            concept: programName 
              ? `Cuota ${p.numero_cuota} - ${programName}`
              : `Cuota ${p.numero_cuota}`,
            amount: parseFloat(p.monto || 0),
            lateFee: parseFloat(p.late_fee_total || 0),
            dueDate: p.fecha_vencimiento,
            status: isOverdue ? 'vencido' as const : 'pendiente' as const,
            daysLate: diasAtraso > 0 ? diasAtraso : null
          }
        }),
        // 🔥 MEJORADO: Historial ordenado con nombre de programa
        paymentHistory: sortedHistory.map((h: any) => {
          const programName = h.estudiante_programa?.programa?.abreviatura 
            || h.estudiante_programa?.programa?.nombre_del_programa 
            || h.cuota?.estudiante_programa?.programa?.abreviatura
            || h.cuota?.estudiante_programa?.programa?.nombre_del_programa
            || ''
          const cuotaNum = h.cuota?.numero_cuota || h.numero_cuota || ''
          return {
            id: h.id,
            concept: programName 
              ? `Pago de cuota${cuotaNum ? ` #${cuotaNum}` : ''} - ${programName}`
              : `Pago de cuota${cuotaNum ? ` #${cuotaNum}` : ''}`,
            amount: parseFloat(h.monto_pagado || 0),
            paymentDate: h.fecha_pago,
            method: h.metodo_pago || 'Transferencia',
            reference: h.numero_boleta || h.banco || 'N/A'
          }
        })
      }

      // Pasar las rutas de los logos al generador de PDF
      await generateDetailedAccountStatePDF(
        accountData,
        '/recursos/Logos-02.png',
        '/recursos/Logos_Mesa.png'
      )
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

  const TASA_CAMBIO = 8
  const esUSD = (accountSummary as any)?.prospecto?.moneda === 'USD'
  const fmtMonto = (gtq: number): string => {
    if (esUSD) {
      const usd = gtq / TASA_CAMBIO
      return `$${usd.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
    }
    return `Q${gtq.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`
  }

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
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-muted-foreground">
                    Información actualizada de tu cuenta estudiantil
                  </p>
                  {esUSD && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700">
                      💱 Moneda: USD · Q8 por $1
                    </span>
                  )}
                </div>
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
                    {fmtMonto(totalCobrado)}
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
                    {fmtMonto(totalPagado)}
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
                    {fmtMonto(balance)}
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
              Tienes un balance pendiente de <strong>{fmtMonto(balance)}</strong>. 
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
                    {fmtMonto(totalCobrado)}
                    {esUSD && <div className="text-xs text-muted-foreground">Q{totalCobrado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</div>}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-green-600">Total Pagado</TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    {fmtMonto(totalPagado)}
                    {esUSD && <div className="text-xs text-muted-foreground">Q{totalPagado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</div>}
                  </TableCell>
                </TableRow>
                <TableRow className="border-t-2">
                  <TableCell className="font-bold">Balance Pendiente</TableCell>
                  <TableCell className={`text-right font-mono font-bold text-lg ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {fmtMonto(balance)}
                    {esUSD && <div className="text-xs text-muted-foreground font-normal">Q{balance.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</div>}
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
