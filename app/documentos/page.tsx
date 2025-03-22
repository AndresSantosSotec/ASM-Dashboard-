"use client"

import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  FileText,
  FileImage,
  FileIcon as FilePdf,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function DocumentosPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Revisión y Validación de Documentos" />
      <main className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Documentos de Estudiantes</CardTitle>
                <CardDescription>Valida los documentos subidos por los estudiantes</CardDescription>
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
                <TabsTrigger value="aprobados">Aprobados</TabsTrigger>
                <TabsTrigger value="rechazados">Rechazados</TabsTrigger>
                <TabsTrigger value="todos">Todos</TabsTrigger>
              </TabsList>
              <TabsContent value="pendientes">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardHeader className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-base">Juan Pérez García</CardTitle>
                            <CardDescription>MBA Ejecutivo</CardDescription>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                          >
                            Pendiente
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {i % 3 === 0 ? (
                                <FileText className="h-5 w-5 text-blue-500" />
                              ) : i % 3 === 1 ? (
                                <FileImage className="h-5 w-5 text-green-500" />
                              ) : (
                                <FilePdf className="h-5 w-5 text-red-500" />
                              )}
                              <span>
                                {i % 3 === 0 ? "DPI" : i % 3 === 1 ? "Título Universitario" : "Carta de Recomendación"}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">12/03/2023</span>
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1">
                                  Ver Documento
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>
                                    {i % 3 === 0
                                      ? "DPI"
                                      : i % 3 === 1
                                        ? "Título Universitario"
                                        : "Carta de Recomendación"}{" "}
                                    - Juan Pérez García
                                  </DialogTitle>
                                  <DialogDescription>Revisa el documento y valida su autenticidad</DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col gap-4">
                                  <div className="rounded-lg border overflow-hidden">
                                    <Image
                                      src="/placeholder.svg?height=600&width=800"
                                      width={800}
                                      height={600}
                                      alt="Documento"
                                      className="w-full object-cover"
                                    />
                                  </div>
                                  <div className="space-y-4">
                                    <div className="flex items-start gap-4 rounded-lg border p-4">
                                      <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
                                      <div>
                                        <h3 className="font-medium">Verificación Pendiente</h3>
                                        <p className="text-sm text-muted-foreground">
                                          Este documento requiere verificación de autenticidad.
                                        </p>
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
                                        Aprobar
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Link href={`/documentos/${i}`} passHref>
                              <Button variant="secondary" className="flex-1">
                                Ver Todos
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="aprobados">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardHeader className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-base">María González López</CardTitle>
                            <CardDescription>Maestría en Marketing Digital</CardDescription>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          >
                            Aprobado
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {i % 2 === 0 ? (
                                <FileText className="h-5 w-5 text-blue-500" />
                              ) : (
                                <FilePdf className="h-5 w-5 text-red-500" />
                              )}
                              <span>{i % 2 === 0 ? "DPI" : "Título Universitario"}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">10/03/2023</span>
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1">
                                  Ver Documento
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>
                                    {i % 2 === 0 ? "DPI" : "Título Universitario"} - María González López
                                  </DialogTitle>
                                  <DialogDescription>Revisa el documento y valida su autenticidad</DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col gap-4">
                                  <div className="rounded-lg border overflow-hidden">
                                    <Image
                                      src="/placeholder.svg?height=600&width=800"
                                      width={800}
                                      height={600}
                                      alt="Documento"
                                      className="w-full object-cover"
                                    />
                                  </div>
                                  <div className="space-y-4">
                                    <div className="flex items-start gap-4 rounded-lg border p-4">
                                      <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                                      <div>
                                        <h3 className="font-medium">Documento Aprobado</h3>
                                        <p className="text-sm text-muted-foreground">
                                          Este documento ha sido verificado y aprobado.
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline">Cerrar</Button>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Link href={`/documentos/${i + 10}`} passHref>
                              <Button variant="secondary" className="flex-1">
                                Ver Todos
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="rechazados">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardHeader className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-base">Carlos Rodríguez Méndez</CardTitle>
                            <CardDescription>Diplomado en Finanzas</CardDescription>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          >
                            Rechazado
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileImage className="h-5 w-5 text-green-500" />
                              <span>Título Universitario</span>
                            </div>
                            <span className="text-xs text-muted-foreground">08/03/2023</span>
                          </div>
                          <div className="flex items-start gap-4 rounded-lg border p-4">
                            <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
                            <div>
                              <h3 className="font-medium">Documento ilegible</h3>
                              <p className="text-sm text-muted-foreground">
                                La imagen es de baja calidad y no se puede verificar la información.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1">
                                  Ver Documento
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>Título Universitario - Carlos Rodríguez Méndez</DialogTitle>
                                  <DialogDescription>Revisa el documento y valida su autenticidad</DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col gap-4">
                                  <div className="rounded-lg border overflow-hidden">
                                    <Image
                                      src="/placeholder.svg?height=600&width=800"
                                      width={800}
                                      height={600}
                                      alt="Documento"
                                      className="w-full object-cover"
                                    />
                                  </div>
                                  <div className="space-y-4">
                                    <div className="flex items-start gap-4 rounded-lg border p-4">
                                      <XCircle className="mt-0.5 h-5 w-5 text-red-500" />
                                      <div>
                                        <h3 className="font-medium">Documento Rechazado</h3>
                                        <p className="text-sm text-muted-foreground">
                                          La imagen es de baja calidad y no se puede verificar la información.
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline">Cerrar</Button>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Link href={`/documentos/${i + 20}`} passHref>
                              <Button variant="secondary" className="flex-1">
                                Ver Todos
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="todos">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <CardHeader className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-base">
                              {i % 3 === 0
                                ? "Juan Pérez García"
                                : i % 3 === 1
                                  ? "María González López"
                                  : "Carlos Rodríguez Méndez"}
                            </CardTitle>
                            <CardDescription>
                              {i % 3 === 0
                                ? "MBA Ejecutivo"
                                : i % 3 === 1
                                  ? "Maestría en Marketing Digital"
                                  : "Diplomado en Finanzas"}
                            </CardDescription>
                          </div>
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
                            {i % 3 === 0 ? "Pendiente" : i % 3 === 1 ? "Aprobado" : "Rechazado"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {i % 3 === 0 ? (
                                <FileText className="h-5 w-5 text-blue-500" />
                              ) : i % 3 === 1 ? (
                                <FileImage className="h-5 w-5 text-green-500" />
                              ) : (
                                <FilePdf className="h-5 w-5 text-red-500" />
                              )}
                              <span>
                                {i % 3 === 0 ? "DPI" : i % 3 === 1 ? "Título Universitario" : "Carta de Recomendación"}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">{`${i + 5}/03/2023`}</span>
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1">
                                  Ver Documento
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>
                                    {i % 3 === 0
                                      ? "DPI"
                                      : i % 3 === 1
                                        ? "Título Universitario"
                                        : "Carta de Recomendación"}{" "}
                                    -{" "}
                                    {i % 3 === 0
                                      ? "Juan Pérez García"
                                      : i % 3 === 1
                                        ? "María González López"
                                        : "Carlos Rodríguez Méndez"}
                                  </DialogTitle>
                                  <DialogDescription>Revisa el documento y valida su autenticidad</DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col gap-4">
                                  <div className="rounded-lg border overflow-hidden">
                                    <Image
                                      src="/placeholder.svg?height=600&width=800"
                                      width={800}
                                      height={600}
                                      alt="Documento"
                                      className="w-full object-cover"
                                    />
                                  </div>
                                  <div className="space-y-4">
                                    {i % 3 === 0 && (
                                      <div className="flex items-start gap-4 rounded-lg border p-4">
                                        <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
                                        <div>
                                          <h3 className="font-medium">Verificación Pendiente</h3>
                                          <p className="text-sm text-muted-foreground">
                                            Este documento requiere verificación de autenticidad.
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                    {i % 3 === 1 && (
                                      <div className="flex items-start gap-4 rounded-lg border p-4">
                                        <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                                        <div>
                                          <h3 className="font-medium">Documento Aprobado</h3>
                                          <p className="text-sm text-muted-foreground">
                                            Este documento ha sido verificado y aprobado.
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                    {i % 3 === 2 && (
                                      <div className="flex items-start gap-4 rounded-lg border p-4">
                                        <XCircle className="mt-0.5 h-5 w-5 text-red-500" />
                                        <div>
                                          <h3 className="font-medium">Documento Rechazado</h3>
                                          <p className="text-sm text-muted-foreground">
                                            La imagen es de baja calidad y no se puede verificar la información.
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline">Cerrar</Button>
                                      {i % 3 === 0 && (
                                        <>
                                          <Button variant="outline" className="gap-2">
                                            <XCircle className="h-4 w-4" />
                                            Rechazar
                                          </Button>
                                          <Button className="gap-2">
                                            <CheckCircle className="h-4 w-4" />
                                            Aprobar
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Link href={`/documentos/${i + 30}`} passHref>
                              <Button variant="secondary" className="flex-1">
                                Ver Todos
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

