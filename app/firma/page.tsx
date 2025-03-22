"use client"

import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, Filter, CheckCircle, XCircle, Download, AlertCircle, MessageSquare, FileText } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"

interface Student {
  id: string
  name: string
  email: string
  dpi: boolean
  receipt: boolean
  constanciaAmerica: boolean
}

const initialStudents: Student[] = [
  {
    id: "1",
    name: "Juan Pérez",
    email: "juan@example.com",
    dpi: true,
    receipt: false,
    constanciaAmerica: true,
  },
  {
    id: "2",
    name: "María García",
    email: "maria@example.com",
    dpi: false,
    receipt: true,
    constanciaAmerica: false,
  },
  {
    id: "3",
    name: "Carlos López",
    email: "carlos@example.com",
    dpi: true,
    receipt: true,
    constanciaAmerica: true,
  },
  {
    id: "4",
    name: "Ana Martínez",
    email: "ana@example.com",
    dpi: false,
    receipt: false,
    constanciaAmerica: true,
  },
]

function StudentManagement() {
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const router = useRouter()

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents((prevSelected) =>
      prevSelected.includes(studentId) ? prevSelected.filter((id) => id !== studentId) : [...prevSelected, studentId],
    )
  }

  const handleViewDetails = (studentId: string) => {
    router.push(`/firma/student-details/${studentId}`)
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Gestión de Alumnos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seleccionar</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>DPI</TableHead>
              <TableHead>Recibo</TableHead>
              <TableHead>Constancia de América</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedStudents.includes(student.id)}
                    onCheckedChange={() => handleSelectStudent(student.id)}
                  />
                </TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>
                  {student.dpi ? <span className="text-green-500">✔️</span> : <span className="text-red-500">❌</span>}
                </TableCell>
                <TableCell>
                  {student.receipt ? (
                    <span className="text-green-500">✔️</span>
                  ) : (
                    <span className="text-red-500">❌</span>
                  )}
                </TableCell>
                <TableCell>
                  {student.constanciaAmerica ? (
                    <span className="text-green-500">✔️</span>
                  ) : (
                    <span className="text-red-500">❌</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="outline" onClick={() => handleViewDetails(student.id)}>
                    Ver Detalles
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default function FirmaPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Verificación de Firma Digital y Contrato" />
      <main className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Contratos y Firmas Digitales</CardTitle>
                <CardDescription>Verifica la firma digital y el contrato de confidencialidad</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Buscar por nombre..." className="pl-8 w-[200px] md:w-[300px]" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                  <span className="sr-only">Filtrar</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pendientes" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
                <TabsTrigger value="verificados">Verificados</TabsTrigger>
                <TabsTrigger value="rechazados">Rechazados</TabsTrigger>
                <TabsTrigger value="todos">Todos</TabsTrigger>
              </TabsList>
              <TabsContent value="pendientes">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                      <CardHeader className="p-4">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">Juan Pérez García</CardTitle>
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                          >
                            Pendiente
                          </Badge>
                        </div>
                        <CardDescription>MBA Ejecutivo</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-blue-500" />
                              <span>Contrato de Confidencialidad</span>
                            </div>
                            <span className="text-xs text-muted-foreground">12/03/2023</span>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="w-full">
                                Verificar Firma
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>Contrato de Confidencialidad - Juan Pérez García</DialogTitle>
                                <DialogDescription>
                                  Verifica la firma digital y el contenido del contrato
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex flex-col gap-4">
                                <div className="rounded-lg border overflow-hidden">
                                  <div className="bg-muted p-2 flex justify-between items-center">
                                    <span className="text-sm font-medium">Contrato_Confidencialidad.pdf</span>
                                    <Button variant="ghost" size="sm" className="gap-1">
                                      <Download className="h-4 w-4" />
                                      Descargar
                                    </Button>
                                  </div>
                                  <div className="h-[400px] overflow-auto p-4 bg-white dark:bg-slate-950">
                                    <div className="space-y-4 text-sm">
                                      <h3 className="text-center font-bold text-lg">CONTRATO DE CONFIDENCIALIDAD</h3>
                                      <p>
                                        En la Ciudad de Guatemala, el día 12 de marzo de 2023, entre UNIVERSIDAD XYZ,
                                        representada por su Rector, y el Sr. Juan Pérez García, con DPI 1234567890123,
                                        se celebra el presente Contrato de Confidencialidad.
                                      </p>
                                      <h4 className="font-bold">CLÁUSULA PRIMERA: OBJETO</h4>
                                      <p>
                                        El presente contrato tiene por objeto establecer los términos y condiciones bajo
                                        los cuales el ESTUDIANTE mantendrá la confidencialidad de la información que le
                                        sea proporcionada durante su participación en el programa académico.
                                      </p>
                                      <h4 className="font-bold">CLÁUSULA SEGUNDA: DEFINICIONES</h4>
                                      <p>
                                        Se entiende por "Información Confidencial" toda aquella información, ya sea
                                        oral, visual, escrita, grabada en medios magnéticos o en cualquier otra forma
                                        tangible, que sea proporcionada al ESTUDIANTE.
                                      </p>
                                      <h4 className="font-bold">CLÁUSULA TERCERA: OBLIGACIONES</h4>
                                      <p>
                                        El ESTUDIANTE se obliga a mantener la más estricta confidencialidad y a no
                                        divulgar a terceras personas la Información Confidencial.
                                      </p>
                                      <div className="flex justify-end mt-8">
                                        <div className="text-center">
                                          <div className="border-b border-black dark:border-white pb-2 mb-2">
                                            <Image
                                              src="/placeholder.svg?height=60&width=200"
                                              width={200}
                                              height={60}
                                              alt="Firma Digital"
                                              className="mx-auto"
                                            />
                                          </div>
                                          <p>Juan Pérez García</p>
                                          <p>DPI: 1234567890123</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="rounded-lg border p-4">
                                  <h3 className="font-medium mb-2">Información de la Firma Digital</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Fecha de Firma:</span>
                                        <span>12/03/2023 15:45:22</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Dirección IP:</span>
                                        <span>192.168.1.45</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Método de Verificación:</span>
                                        <span>Correo Electrónico + SMS</span>
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Estado de la Firma:</span>
                                        <Badge
                                          variant="outline"
                                          className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                                        >
                                          Pendiente de Verificación
                                        </Badge>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Certificado Digital:</span>
                                        <span>Válido</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Hash del Documento:</span>
                                        <span className="truncate max-w-[200px]">a1b2c3d4e5f6g7h8i9j0...</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <h3 className="font-medium">Agregar Comentario</h3>
                                  <div className="flex gap-2">
                                    <Input placeholder="Escribe un comentario..." />
                                    <Button size="sm">
                                      <MessageSquare className="mr-2 h-4 w-4" />
                                      Enviar
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" className="gap-2">
                                    <XCircle className="h-4 w-4" />
                                    Rechazar
                                  </Button>
                                  <Button className="gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Verificar
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="verificados">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader className="p-4">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">María González López</CardTitle>
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          >
                            Verificado
                          </Badge>
                        </div>
                        <CardDescription>Maestría en Marketing Digital</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-blue-500" />
                              <span>Contrato de Confidencialidad</span>
                            </div>
                            <span className="text-xs text-muted-foreground">10/03/2023</span>
                          </div>
                          <Button variant="outline" className="w-full">
                            Ver Contrato
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="rechazados">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2].map((i) => (
                    <Card key={i}>
                      <CardHeader className="p-4">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">Carlos Rodríguez Méndez</CardTitle>
                          <Badge
                            variant="outline"
                            className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          >
                            Rechazado
                          </Badge>
                        </div>
                        <CardDescription>Diplomado en Finanzas</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-blue-500" />
                              <span>Contrato de Confidencialidad</span>
                            </div>
                            <span className="text-xs text-muted-foreground">08/03/2023</span>
                          </div>
                          <div className="flex items-start gap-4 rounded-lg border p-4">
                            <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
                            <div>
                              <h3 className="font-medium">Firma inválida</h3>
                              <p className="text-sm text-muted-foreground">
                                La firma no coincide con el documento de identidad.
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" className="w-full">
                            Ver Contrato
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="todos">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <Card key={i}>
                      <CardHeader className="p-4">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">
                            {i % 3 === 0
                              ? "Juan Pérez García"
                              : i % 3 === 1
                                ? "María González López"
                                : "Carlos Rodríguez Méndez"}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={
                              i % 3 === 0
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                                : i % 3 === 1
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            }
                          >
                            {i % 3 === 0 ? "Pendiente" : i % 3 === 1 ? "Verificado" : "Rechazado"}
                          </Badge>
                        </div>
                        <CardDescription>
                          {i % 3 === 0
                            ? "MBA Ejecutivo"
                            : i % 3 === 1
                              ? "Maestría en Marketing Digital"
                              : "Diplomado en Finanzas"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-blue-500" />
                              <span>Contrato de Confidencialidad</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{`${i + 5}/03/2023`}</span>
                          </div>
                          <Button variant="outline" className="w-full">
                            {i % 3 === 0 ? "Verificar Firma" : "Ver Contrato"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Add the Student Management component here */}
        <StudentManagement />
      </main>
    </div>
  )
}

