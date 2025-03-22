"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Search, Upload, Download, Eye, Clock, CheckCircle, XCircle } from "lucide-react"

export function DocumentsView() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Mis Documentos</CardTitle>
              <CardDescription>Gestiona tus documentos académicos</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Buscar documento..." className="pl-8 w-[200px] md:w-[300px]" />
              </div>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Subir Documento
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="pending">Pendientes</TabsTrigger>
              <TabsTrigger value="approved">Aprobados</TabsTrigger>
              <TabsTrigger value="rejected">Rechazados</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Nombre del Documento</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Fecha de Subida</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      {
                        name: "Certificado de Nacimiento",
                        type: "Documento Personal",
                        date: "15/01/2023",
                        status: "Aprobado",
                      },
                      {
                        name: "Título Universitario",
                        type: "Documento Académico",
                        date: "20/01/2023",
                        status: "Aprobado",
                      },
                      {
                        name: "Carta de Recomendación",
                        type: "Documento Académico",
                        date: "25/01/2023",
                        status: "Pendiente",
                      },
                      {
                        name: "Comprobante de Pago",
                        type: "Documento Financiero",
                        date: "01/02/2023",
                        status: "Rechazado",
                      },
                      {
                        name: "Formulario de Inscripción",
                        type: "Documento Administrativo",
                        date: "05/02/2023",
                        status: "Aprobado",
                      },
                    ].map((doc, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">{doc.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{doc.type}</td>
                        <td className="px-4 py-3 text-sm">{doc.date}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={
                              doc.status === "Aprobado"
                                ? "bg-green-100 text-green-800"
                                : doc.status === "Pendiente"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {doc.status === "Aprobado" ? (
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            ) : doc.status === "Pendiente" ? (
                              <Clock className="h-3.5 w-3.5 mr-1" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                            )}
                            {doc.status}
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

            <TabsContent value="pending">
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Nombre del Documento</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Fecha de Subida</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      {
                        name: "Carta de Recomendación",
                        type: "Documento Académico",
                        date: "25/01/2023",
                        status: "Pendiente",
                      },
                    ].map((doc, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">{doc.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{doc.type}</td>
                        <td className="px-4 py-3 text-sm">{doc.date}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="bg-amber-100 text-amber-800">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            {doc.status}
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

            <TabsContent value="approved">
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Nombre del Documento</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Fecha de Subida</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      {
                        name: "Certificado de Nacimiento",
                        type: "Documento Personal",
                        date: "15/01/2023",
                        status: "Aprobado",
                      },
                      {
                        name: "Título Universitario",
                        type: "Documento Académico",
                        date: "20/01/2023",
                        status: "Aprobado",
                      },
                      {
                        name: "Formulario de Inscripción",
                        type: "Documento Administrativo",
                        date: "05/02/2023",
                        status: "Aprobado",
                      },
                    ].map((doc, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">{doc.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{doc.type}</td>
                        <td className="px-4 py-3 text-sm">{doc.date}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            {doc.status}
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

            <TabsContent value="rejected">
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Nombre del Documento</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Fecha de Subida</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      {
                        name: "Comprobante de Pago",
                        type: "Documento Financiero",
                        date: "01/02/2023",
                        status: "Rechazado",
                      },
                    ].map((doc, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">{doc.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{doc.type}</td>
                        <td className="px-4 py-3 text-sm">{doc.date}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="bg-red-100 text-red-800">
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            {doc.status}
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

