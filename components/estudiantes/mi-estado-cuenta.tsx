"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Pago {
  id: string
  fecha: string
  concepto: string
  monto: number
  estado: "pagado" | "pendiente" | "vencido"
  comprobante?: string
  fechaPago?: string
}

interface EstadoCuentaData {
  saldoTotal: number
  proximoPago: {
    fecha: string
    monto: number
  }
  pagos: Pago[]
  historial: Pago[]
}

// Esta función simularía la descarga real del PDF
const descargarEstadoCuenta = () => {
  // En una implementación real, esto generaría y descargaría un PDF
  alert("Descargando estado de cuenta...")
}

export function MiEstadoCuenta() {
  const [cargando, setCargando] = useState(false)

  // Datos de ejemplo - en producción vendrían de una API
  const datosEstadoCuenta: EstadoCuentaData = {
    saldoTotal: 2500,
    proximoPago: {
      fecha: "05/04/2025",
      monto: 500,
    },
    pagos: [
      { id: "pag-001", fecha: "05/04/2025", concepto: "Mensualidad Abril", monto: 500, estado: "pendiente" },
      { id: "pag-002", fecha: "05/05/2025", concepto: "Mensualidad Mayo", monto: 500, estado: "pendiente" },
      { id: "pag-003", fecha: "05/06/2025", concepto: "Mensualidad Junio", monto: 500, estado: "pendiente" },
      { id: "pag-004", fecha: "05/07/2025", concepto: "Mensualidad Julio", monto: 500, estado: "pendiente" },
      { id: "pag-005", fecha: "05/08/2025", concepto: "Mensualidad Agosto", monto: 500, estado: "pendiente" },
    ],
    historial: [
      {
        id: "pag-h001",
        fecha: "05/01/2025",
        concepto: "Mensualidad Enero",
        monto: 500,
        estado: "pagado",
        comprobante: "BOL-12345",
        fechaPago: "03/01/2025",
      },
      {
        id: "pag-h002",
        fecha: "05/02/2025",
        concepto: "Mensualidad Febrero",
        monto: 500,
        estado: "pagado",
        comprobante: "BOL-12346",
        fechaPago: "04/02/2025",
      },
      {
        id: "pag-h003",
        fecha: "05/03/2025",
        concepto: "Mensualidad Marzo",
        monto: 500,
        estado: "pagado",
        comprobante: "BOL-12347",
        fechaPago: "02/03/2025",
      },
    ],
  }

  const handleDescargar = () => {
    setCargando(true)
    // Simulamos una descarga con un pequeño retraso
    setTimeout(() => {
      descargarEstadoCuenta()
      setCargando(false)
    }, 1500)
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pagado":
        return <Badge className="bg-green-500">Pagado</Badge>
      case "pendiente":
        return <Badge variant="outline">Pendiente</Badge>
      case "vencido":
        return <Badge variant="destructive">Vencido</Badge>
      default:
        return <Badge variant="secondary">Desconocido</Badge>
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Mi Estado de Cuenta
        </CardTitle>
        <CardDescription>Consulta tu estado de cuenta actual y el historial de pagos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Q {datosEstadoCuenta.saldoTotal.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Próximo Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Q {datosEstadoCuenta.proximoPago.monto.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Fecha límite: {datosEstadoCuenta.proximoPago.fecha}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-lg font-medium">Al día</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Información importante</AlertTitle>
            <AlertDescription>
              Recuerda que los pagos deben realizarse antes del día 5 de cada mes para evitar recargos por mora.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="pendientes">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pendientes">Pagos Pendientes</TabsTrigger>
              <TabsTrigger value="historial">Historial de Pagos</TabsTrigger>
            </TabsList>
            <TabsContent value="pendientes">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datosEstadoCuenta.pagos.map((pago) => (
                    <TableRow key={pago.id}>
                      <TableCell>{pago.fecha}</TableCell>
                      <TableCell>{pago.concepto}</TableCell>
                      <TableCell>Q {pago.monto.toFixed(2)}</TableCell>
                      <TableCell>{getEstadoBadge(pago.estado)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="historial">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Comprobante</TableHead>
                    <TableHead>Fecha de Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datosEstadoCuenta.historial.map((pago) => (
                    <TableRow key={pago.id}>
                      <TableCell>{pago.fecha}</TableCell>
                      <TableCell>{pago.concepto}</TableCell>
                      <TableCell>Q {pago.monto.toFixed(2)}</TableCell>
                      <TableCell>{pago.comprobante}</TableCell>
                      <TableCell>{pago.fechaPago}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleDescargar} disabled={cargando} className="w-full sm:w-auto">
          {cargando ? "Generando documento..." : "Descargar Estado de Cuenta"}
          {!cargando && <Download className="ml-2 h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  )
}

