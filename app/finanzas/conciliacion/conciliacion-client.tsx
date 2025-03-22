"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Search,
  Download,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import Link from "next/link"

export default function ConciliacionClient() {
  const [activeTab, setActiveTab] = useState("pendientes")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState("Sin archivos seleccionados")
  const [showStructure, setShowStructure] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [currentColumn, setCurrentColumn] = useState({ id: 0, name: "", column: 0 })
  const [showResults, setShowResults] = useState(false)

  const expectedStructure = [
    { id: 1, name: "Carnet", column: 1 },
    { id: 2, name: "Nombre del Alumno", column: 2 },
    { id: 3, name: "Carrera", column: 3 },
    { id: 4, name: "Banco", column: 4 },
    { id: 5, name: "Número de Recibo", column: 5 },
    { id: 6, name: "Monto", column: 6 },
    { id: 7, name: "Fecha de Pago", column: 7 },
    { id: 8, name: "Número de Autorización", column: 8 },
  ]

  // Datos de ejemplo para la demostración
  const pendientesData = [
    {
      id: 1,
      alumno: "Carlos Méndez",
      carnet: "2023-0042",
      carrera: "Desarrollo Web Full Stack",
      estado: "Pendiente de Conciliación",
      banco: "Banco Industrial",
      recibo: "BI-123456",
      monto: 750,
      fecha: "2025-03-10",
      autorizacion: "AUTH-987654",
      fechaCarga: "2025-03-10",
    },
    {
      id: 2,
      alumno: "Ana Gutiérrez",
      carnet: "2023-0078",
      carrera: "Diseño UX/UI",
      estado: "Pendiente de Conciliación",
      banco: "Banrural",
      recibo: "BR-789012",
      monto: 950,
      fecha: "2025-03-09",
      autorizacion: "AUTH-456789",
      fechaCarga: "2025-03-09",
    },
    {
      id: 3,
      alumno: "Luis Hernández",
      carnet: "2024-0103",
      carrera: "Inteligencia Artificial",
      estado: "Pendiente de Conciliación",
      banco: "Banco G&T",
      recibo: "GT-345678",
      monto: 1200,
      fecha: "2025-03-08",
      autorizacion: "AUTH-234567",
      fechaCarga: "2025-03-08",
    },
  ]

  const conciliadosData = [
    {
      id: 4,
      alumno: "María Rodríguez",
      carnet: "2022-0156",
      carrera: "Ciencia de Datos",
      estado: "Conciliado",
      banco: "Banco Industrial",
      recibo: "BI-567890",
      monto: 850,
      fecha: "2025-03-05",
      autorizacion: "AUTH-123456",
      fechaCarga: "2025-03-05",
      fechaConciliacion: "2025-03-06",
    },
    {
      id: 5,
      alumno: "Juan Pérez",
      carnet: "2023-0015",
      carrera: "Desarrollo Web Full Stack",
      estado: "Conciliado",
      banco: "Banrural",
      recibo: "BR-123789",
      monto: 750,
      fecha: "2025-03-04",
      autorizacion: "AUTH-789012",
      fechaCarga: "2025-03-04",
      fechaConciliacion: "2025-03-05",
    },
  ]

  const rechazadosData = [
    {
      id: 6,
      alumno: "Roberto Gómez",
      carnet: "2024-0056",
      carrera: "Ciberseguridad",
      estado: "Rechazado",
      banco: "Banco G&T",
      recibo: "GT-901234",
      monto: 950,
      fecha: "2025-03-03",
      autorizacion: "AUTH-345678",
      fechaCarga: "2025-03-03",
      motivo: "Monto incorrecto",
    },
    {
      id: 7,
      alumno: "Patricia López",
      carnet: "2023-0098",
      carrera: "Marketing Digital",
      estado: "Rechazado",
      banco: "Banco Industrial",
      recibo: "BI-456789",
      monto: 800,
      fecha: "2025-03-02",
      autorizacion: "AUTH-567890",
      fechaCarga: "2025-03-02",
      motivo: "Recibo duplicado",
    },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setFileName(file.name)
    }
  }

  const handleEditColumn = (column: (typeof expectedStructure)[0]) => {
    setCurrentColumn(column)
    setEditDialogOpen(true)
  }

  const handleSaveColumnEdit = () => {
    // Aquí iría la lógica para guardar los cambios en la columna
    setEditDialogOpen(false)
  }

  const handleImport = () => {
    // Aquí iría la lógica para procesar el archivo y realizar la conciliación automática
    setShowResults(true)
    setActiveTab("pendientes")
  }

  const handleConciliar = (id: number) => {
    // Aquí iría la lógica para conciliar un recibo
    alert(`Conciliando recibo ID: ${id}`)
  }

  const handleRechazar = (id: number) => {
    // Aquí iría la lógica para rechazar un recibo
    alert(`Rechazando recibo ID: ${id}`)
  }

  const handleExportResults = () => {
    // Aquí iría la lógica para exportar los resultados a Excel
    alert("Exportando resultados a Excel...")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Conciliación de Pagos</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-[600px]">
          <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          <TabsTrigger value="conciliados">Conciliados</TabsTrigger>
          <TabsTrigger value="rechazados">Rechazados</TabsTrigger>
          <TabsTrigger value="importar">Importar Recibos</TabsTrigger>
        </TabsList>

        {/* Pestaña de Pendientes */}
        <TabsContent value="pendientes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recibos Pendientes de Conciliación</CardTitle>
                <CardDescription>Gestione los recibos de pago pendientes de conciliación.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportResults}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Buscar por alumno, carnet o recibo..." className="pl-8" />
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="todos">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por banco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los bancos</SelectItem>
                      <SelectItem value="bi">Banco Industrial</SelectItem>
                      <SelectItem value="banrural">Banrural</SelectItem>
                      <SelectItem value="gt">Banco G&T</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Carnet</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Recibo</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendientesData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.alumno}</TableCell>
                        <TableCell>{item.carnet}</TableCell>
                        <TableCell>{item.banco}</TableCell>
                        <TableCell>{item.recibo}</TableCell>
                        <TableCell className="text-right">Q{item.monto.toLocaleString("es-GT")}</TableCell>
                        <TableCell>{item.fecha}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {item.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                              onClick={() => handleConciliar(item.id)}
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Conciliar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                              onClick={() => handleRechazar(item.id)}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Rechazar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Conciliados */}
        <TabsContent value="conciliados">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recibos Conciliados</CardTitle>
                <CardDescription>Historial de recibos de pago conciliados.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportResults}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Buscar por alumno, carnet o recibo..." className="pl-8" />
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="todos">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por banco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los bancos</SelectItem>
                      <SelectItem value="bi">Banco Industrial</SelectItem>
                      <SelectItem value="banrural">Banrural</SelectItem>
                      <SelectItem value="gt">Banco G&T</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Carnet</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Recibo</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Fecha Pago</TableHead>
                      <TableHead>Fecha Conciliación</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conciliadosData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.alumno}</TableCell>
                        <TableCell>{item.carnet}</TableCell>
                        <TableCell>{item.banco}</TableCell>
                        <TableCell>{item.recibo}</TableCell>
                        <TableCell className="text-right">Q{item.monto.toLocaleString("es-GT")}</TableCell>
                        <TableCell>{item.fecha}</TableCell>
                        <TableCell>{item.fechaConciliacion}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {item.estado}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Rechazados */}
        <TabsContent value="rechazados">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recibos Rechazados</CardTitle>
                <CardDescription>Historial de recibos de pago rechazados.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportResults}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Buscar por alumno, carnet o recibo..." className="pl-8" />
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="todos">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por banco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los bancos</SelectItem>
                      <SelectItem value="bi">Banco Industrial</SelectItem>
                      <SelectItem value="banrural">Banrural</SelectItem>
                      <SelectItem value="gt">Banco G&T</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Carnet</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Recibo</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rechazadosData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.alumno}</TableCell>
                        <TableCell>{item.carnet}</TableCell>
                        <TableCell>{item.banco}</TableCell>
                        <TableCell>{item.recibo}</TableCell>
                        <TableCell className="text-right">Q{item.monto.toLocaleString("es-GT")}</TableCell>
                        <TableCell>{item.fecha}</TableCell>
                        <TableCell>{item.motivo}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {item.estado}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Importar */}
        <TabsContent value="importar">
          <Card>
            <CardHeader>
              <CardTitle>Importar Estado de Cuenta con los Pago</CardTitle>
              <CardDescription>
                Cargue un archivo Excel o CSV con los recibos de pago para realizar una conciliación automática.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Archivo Excel o CSV</h3>
                  <div className="flex items-center gap-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="file-upload">Seleccionar archivo</Label>
                      <div className="relative">
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => document.getElementById("file-upload")?.click()}
                        >
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          {fileName}
                        </Button>
                      </div>
                    </div>
                    {selectedFile && (
                      <Button variant="outline" onClick={() => setSelectedFile(null)}>
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setShowStructure(!showStructure)}>
                    {showStructure ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Ocultar Estructura
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Mostrar Estructura
                      </>
                    )}
                  </Button>
                  <Button onClick={handleImport} disabled={!selectedFile}>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar Recibos
                  </Button>
                </div>

                {showStructure && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Estructura esperada</h3>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Nombre de la columna</TableHead>
                            <TableHead>No. de Columna</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expectedStructure.map((column) => (
                            <TableRow key={column.id}>
                              <TableCell>{column.id}</TableCell>
                              <TableCell>{column.name}</TableCell>
                              <TableCell>{column.column}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="secondary" size="sm" onClick={() => handleEditColumn(column)}>
                                  Editar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-amber-800">
                          Asegúrese de que su archivo Excel tenga la misma estructura que la tabla anterior. Puede
                          editar la asignación de columnas si su archivo tiene un formato diferente.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ejemplo de datos */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Columna</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="column-id">Columna</Label>
              <Input id="column-id" value={currentColumn.id} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="column-name">Nombre de Columna</Label>
              <Input
                id="column-name"
                value={currentColumn.name}
                onChange={(e) => setCurrentColumn({ ...currentColumn, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="column-number">No. de Columna</Label>
              <Input
                id="column-number"
                type="number"
                value={currentColumn.column}
                onChange={(e) => setCurrentColumn({ ...currentColumn, column: Number.parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveColumnEdit}>
              <Check className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

