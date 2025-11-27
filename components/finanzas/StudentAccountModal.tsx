"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, AlertTriangle, Calendar, Clock, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchEstadoCuenta, type AccountData } from "@/services/estudiantes"
import { generateDetailedAccountStatePDF } from "@/lib/pdf-generator"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  prospectoId?: number | null
}

export default function StudentAccountModal({ open, onOpenChange, prospectoId }: Props) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AccountData | null>(null)

  useEffect(() => {
    if (!open || !prospectoId) return
    setLoading(true)
    fetchEstadoCuenta(prospectoId)
      .then(setData)
      .finally(() => setLoading(false))
  }, [open, prospectoId])

  // 🔥 CORRECCIÓN: Total = suma de montos base + mora única Q50
  const totalPending = () => {
    const sumaBase = (data?.pendingPayments ?? []).reduce((acc, p) => acc + p.amount, 0)
    const moraTotal = (data?.balance?.totalMora ?? 0)
    return sumaBase + moraTotal
  }

  const handleGeneratePDF = async () => {
    if (!data) return
    try {
      await generateDetailedAccountStatePDF(data)
    } catch (error) {
      console.error('Error generando PDF:', error)
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>Estado de Cuenta</DialogTitle>
          <DialogDescription>
            {data ? `${data.student.name} — ${data.student.carnet ?? ''}` : 'Cargando...'}
          </DialogDescription>
        </DialogHeader>

        {loading || !data ? (
          <div className="py-16 text-center">Cargando...</div>
        ) : (
          <div className="space-y-6 max-h-[70vh] overflow-auto pr-1">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Resumen</CardTitle>
                    <CardDescription>Situación actual de pagos</CardDescription>
                  </div>
                  {data.balance.isBlocked ? (
                    <Badge variant="destructive">Cuenta Bloqueada</Badge>
                  ) : data.balance.warningLevel > 0 ? (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
                      {data.balance.warningLevel === 2 ? "Riesgo de Bloqueo" : "Advertencia de Pago"}
                    </Badge>
                  ) : (
                    <Badge className="bg-green-500">Al Día</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm text-muted-foreground">Saldo Pendiente</h4>
                  <div className="text-2xl font-bold">
                    Q{totalPending().toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm text-muted-foreground">Próximo vencimiento</h4>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">
                      {data.balance.nextDueDate ? new Date(data.balance.nextDueDate).toLocaleDateString('es-GT') : '—'}
                    </span>
                  </div>
                  {typeof data.balance.daysUntilDue === 'number' && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {data.balance.daysUntilDue >= 0
                          ? `Faltan ${data.balance.daysUntilDue} días`
                          : `Venció hace ${Math.abs(data.balance.daysUntilDue)} días`}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm text-muted-foreground">Estado</h4>
                  <div className="flex items-center gap-2">
                    {data.balance.latePayments === 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                    <span className="font-medium">
                      {data.balance.latePayments === 0
                        ? "Al día"
                        : `${data.balance.latePayments} pago(s) atrasado(s)`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {data.balance.warningLevel > 0 && (
              <Alert variant={data.balance.warningLevel === 2 ? "destructive" : "default"}
                     className={data.balance.warningLevel === 2 ? "" : "border-yellow-500 text-yellow-700 bg-yellow-50"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{data.balance.warningLevel === 2 ? "Cuenta en riesgo de bloqueo" : "Pago vencido"}</AlertTitle>
                <AlertDescription>
                  {data.balance.warningLevel === 2
                    ? "La cuenta será bloqueada si no se regulariza el saldo."
                    : "Regularice su pago para evitar recargos y bloqueo."}
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pagos pendientes</CardTitle>
                <CardDescription>Cuotas por pagar</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Vence</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.pendingPayments.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Sin pendientes</TableCell></TableRow>
                    ) : data.pendingPayments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.concept}</TableCell>
                        <TableCell>{new Date(p.dueDate).toLocaleDateString('es-GT')}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === 'vencido' ? 'destructive' : 'outline'}>
                            {p.status === 'vencido' ? `Vencido${p.daysLate ? ` (${p.daysLate} días)` : ''}` : 'Pendiente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          Q{p.amount.toLocaleString('es-GT',{ minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {(data.balance.totalMora ?? 0) > 0 && (
                    <tfoot>
                      <TableRow className="border-t-2 font-bold bg-muted/50">
                        <TableCell colSpan={3} className="text-right">
                          Mora (recargo único):
                        </TableCell>
                        <TableCell className="text-right">
                          Q{(data.balance.totalMora ?? 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-bold">
                        <TableCell colSpan={3} className="text-right">
                          Total a pagar:
                        </TableCell>
                        <TableCell className="text-right text-lg">
                          Q{totalPending().toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    </tfoot>
                  )}
                </Table>
              </CardContent>
              <CardFooter className="justify-end">
                <Button variant="outline" onClick={handleGeneratePDF}>
                  <Download className="h-4 w-4 mr-2" /> 
                  Descargar estado (PDF)
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historial de pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.paymentHistory.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Sin pagos registrados</TableCell></TableRow>
                    ) : data.paymentHistory.map(h => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium">{h.concept}</TableCell>
                        <TableCell>{new Date(h.paymentDate).toLocaleDateString('es-GT')}</TableCell>
                        <TableCell>{h.method ?? '—'}</TableCell>
                        <TableCell>{h.reference ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          Q{h.amount.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}