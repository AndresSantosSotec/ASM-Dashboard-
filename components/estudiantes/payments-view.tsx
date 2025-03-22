"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Download, Eye, Receipt, DollarSign, Calendar, AlertCircle } from "lucide-react"

export function PaymentsView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance Actual</p>
                <h3 className="text-2xl font-bold">$2,500.00</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Receipt className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Último Pago</p>
                <h3 className="text-2xl font-bold">$500.00</h3>
                <p className="text-xs text-muted-foreground">15/02/2023</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-amber-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Próximo Pago</p>
                <h3 className="text-2xl font-bold">$500.00</h3>
                <p className="text-xs text-muted-foreground">15/03/2023</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
          <CardDescription>Registro de todos tus pagos y facturas</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="payments">
            <TabsList className="mb-4">
              <TabsTrigger value="payments">Pagos</TabsTrigger>
              <TabsTrigger value="invoices">Facturas</TabsTrigger>
              <TabsTrigger value="payment-plan">Plan de Pagos</TabsTrigger>
            </TabsList>

            <TabsContent value="payments">
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Referencia</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Fecha</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Monto</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Método</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      {
                        reference: "PAY-2023-001",
                        date: "15/02/2023",
                        amount: "$500.00",
                        method: "Tarjeta de Crédito",
                        status: "Completado",
                      },
                      {
                        reference: "PAY-2023-002",
                        date: "15/01/2023",
                        amount: "$500.00",
                        method: "Transferencia Bancaria",
                        status: "Completado",
                      },
                      {
                        reference: "PAY-2023-003",
                        date: "15/12/2022",
                        amount: "$500.00",
                        method: "Tarjeta de Crédito",
                        status: "Completado",
                      },
                      {
                        reference: "PAY-2023-004",
                        date: "15/11/2022",
                        amount: "$500.00",
                        method: "Transferencia Bancaria",
                        status: "Completado",
                      },
                      {
                        reference: "PAY-2023-005",
                        date: "15/10/2022",
                        amount: "$500.00",
                        method: "Tarjeta de Crédito",
                        status: "Completado",
                      },
                    ].map((payment, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 font-medium">{payment.reference}</td>
                        <td className="px-4 py-3 text-sm">{payment.date}</td>
                        <td className="px-4 py-3 text-sm">{payment.amount}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-1">
                            {payment.method === "Tarjeta de Crédito" ? (
                              <CreditCard className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Receipt className="h-4 w-4 text-green-600" />
                            )}
                            <span>{payment.method}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            {payment.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Ver</span>
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Descargar</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="invoices">
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Factura</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Fecha</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Monto</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Concepto</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      {
                        invoice: "INV-2023-001",
                        date: "01/02/2023",
                        amount: "$500.00",
                        concept: "Mensualidad MBA Ejecutivo",
                        status: "Pagado",
                      },
                      {
                        invoice: "INV-2023-002",
                        date: "01/01/2023",
                        amount: "$500.00",
                        concept: "Mensualidad MBA Ejecutivo",
                        status: "Pagado",
                      },
                      {
                        invoice: "INV-2023-003",
                        date: "01/12/2022",
                        amount: "$500.00",
                        concept: "Mensualidad MBA Ejecutivo",
                        status: "Pagado",
                      },
                      {
                        invoice: "INV-2023-004",
                        date: "01/11/2022",
                        amount: "$500.00",
                        concept: "Mensualidad MBA Ejecutivo",
                        status: "Pagado",
                      },
                      {
                        invoice: "INV-2023-005",
                        date: "01/10/2022",
                        amount: "$500.00",
                        concept: "Mensualidad MBA Ejecutivo",
                        status: "Pagado",
                      },
                    ].map((invoice, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 font-medium">{invoice.invoice}</td>
                        <td className="px-4 py-3 text-sm">{invoice.date}</td>
                        <td className="px-4 py-3 text-sm">{invoice.amount}</td>
                        <td className="px-4 py-3 text-sm">{invoice.concept}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            {invoice.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Ver</span>
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Descargar</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="payment-plan">
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Plan de Pagos - MBA Ejecutivo</h4>
                    <p className="text-sm text-blue-700">
                      Costo total del programa: $12,000.00 - Pagadero en 24 cuotas mensuales de $500.00
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Cuota</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Fecha de Vencimiento</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Monto</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        { number: 6, date: "15/03/2023", amount: "$500.00", status: "Pendiente" },
                        { number: 7, date: "15/04/2023", amount: "$500.00", status: "Pendiente" },
                        { number: 8, date: "15/05/2023", amount: "$500.00", status: "Pendiente" },
                        { number: 9, date: "15/06/2023", amount: "$500.00", status: "Pendiente" },
                        { number: 10, date: "15/07/2023", amount: "$500.00", status: "Pendiente" },
                      ].map((payment, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 font-medium">Cuota {payment.number}</td>
                          <td className="px-4 py-3 text-sm">{payment.date}</td>
                          <td className="px-4 py-3 text-sm">{payment.amount}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="bg-amber-100 text-amber-800">
                              {payment.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Mostrando cuotas 6-10 de 24. Cuotas pagadas: 5</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">Ver Todas</Button>
                    <Button>Realizar Pago</Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

