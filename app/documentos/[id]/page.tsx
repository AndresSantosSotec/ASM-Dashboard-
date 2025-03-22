"use client"

import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  FileImage,
  FileIcon as FilePdf,
  FileArchive,
  Download,
  RotateCw,
  History,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export default function DocumentosEstudiantePage({ params }: { params: { id: string } }) {
  // Estado para controlar qué modal está abierto
  const [openModalId, setOpenModalId] = useState<number | null>(null)

  // Función para abrir un modal específico
  const openModal = (id: number) => {
    setOpenModalId(id)
  }

  // Función para cerrar el modal
  const closeModal = () => {
    setOpenModalId(null)
  }

  // Datos de ejemplo para el estudiante
  const estudiante = {
    id: params.id,
    nombre: "Juan Pérez García",
    programa: "MBA Ejecutivo",
    fechaInscripcion: "12/03/2023",
    estado: "En Proceso",
  }

  // Documentos obligatorios de ejemplo
  const documentosObligatorios = [
    {
      id: 1,
      nombre: "Documento de Identidad (DPI)",
      tipo: "image",
      icono: FileImage,
      fecha: "12/03/2023",
      estado: "pendiente",
      comentarios: 1,
      thumbnail: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 2,
      nombre: "Título Universitario",
      tipo: "pdf",
      icono: FilePdf,
      fecha: "13/03/2023",
      estado: "rechazado",
      comentarios: 2,
      thumbnail: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 3,
      nombre: "Certificado de Nacimiento",
      tipo: "image",
      icono: FileImage,
      fecha: "14/03/2023",
      estado: "aprobado",
      comentarios: 0,
      thumbnail: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 4,
      nombre: "Formulario de Inscripción Firmado",
      tipo: "pdf",
      icono: FilePdf,
      fecha: "15/03/2023",
      estado: "pendiente",
      comentarios: 0,
      thumbnail: "/placeholder.svg?height=100&width=100",
    },
  ]

  // Documentos adicionales de ejemplo
  const documentosAdicionales = [
    {
      id: 5,
      nombre: "Carta de Recomendación",
      tipo: "pdf",
      icono: FilePdf,
      fecha: "16/03/2023",
      estado: "aprobado",
      comentarios: 0,
      thumbnail: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 6,
      nombre: "Certificado de Idiomas",
      tipo: "pdf",
      icono: FilePdf,
      fecha: "17/03/2023",
      estado: "pendiente",
      comentarios: 1,
      thumbnail: "/placeholder.svg?height=100&width=100",
    },
    {
      id: 7,
      nombre: "Constancia Laboral",
      tipo: "archive",
      icono: FileArchive,
      fecha: "18/03/2023",
      estado: "pendiente",
      comentarios: 0,
      thumbnail: "/placeholder.svg?height=100&width=100",
    },
  ]

  // Historial de comentarios de ejemplo para un documento
  const historialComentarios = [
    {
      id: 1,
      usuario: "Roberto Gómez",
      fecha: "14/03/2023 10:30",
      mensaje: "La imagen del título está borrosa. Por favor, suba una versión con mejor resolución.",
      rol: "Asesor",
    },
    {
      id: 2,
      usuario: "Juan Pérez García",
      fecha: "15/03/2023 09:15",
      mensaje: "He subido una nueva versión del documento con mejor calidad.",
      rol: "Estudiante",
    },
  ]

  // Función para renderizar el modal de un documento
  const renderDocumentModal = (documento) => (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <documento.icono className="h-5 w-5 text-blue-500" />
          {documento.nombre}
        </DialogTitle>
        <DialogDescription>
          Subido el {documento.fecha} | Estado:{" "}
          <span
            className={
              documento.estado === "aprobado"
                ? "text-green-600 dark:text-green-400"
                : documento.estado === "pendiente"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400"
            }
          >
            {documento.estado === "aprobado"
              ? "Aprobado"
              : documento.estado === "pendiente"
                ? "Pendiente"
                : "Rechazado"}
          </span>
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-auto grid md:grid-cols-[2fr_1fr] gap-4">
        {/* Vista del documento */}
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted p-2 flex justify-between items-center">
            <span className="text-sm font-medium">
              {documento.nombre}.{documento.tipo === "image" ? "jpg" : documento.tipo === "pdf" ? "pdf" : "zip"}
            </span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <RotateCw className="h-4 w-4" />
                <span className="sr-only">Rotar</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Download className="h-4 w-4" />
                <span className="sr-only">Descargar</span>
              </Button>
            </div>
          </div>
          <div className="h-[400px] overflow-auto bg-white dark:bg-slate-950 flex items-center justify-center">
            <Image
              src="/placeholder.svg?height=600&width=800"
              width={800}
              height={600}
              alt={documento.nombre}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>

        {/* Sección de comentarios y acciones */}
        <div className="flex flex-col h-full">
          <div className="rounded-lg border overflow-hidden flex-1">
            <div className="bg-muted p-2">
              <span className="text-sm font-medium">Historial de comentarios</span>
            </div>
            <div className="p-3 space-y-3 overflow-auto max-h-[250px]">
              {documento.comentarios > 0 ? (
                historialComentarios.map((comentario) => (
                  <div key={comentario.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium flex items-center gap-1">
                        {comentario.usuario}
                        <Badge variant="outline" className="text-xs font-normal">
                          {comentario.rol}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{comentario.fecha}</span>
                    </div>
                    <p className="text-muted-foreground">{comentario.mensaje}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">No hay comentarios para este documento</div>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <Textarea placeholder="Agregar un comentario o solicitar correcciones..." />
            <div className="flex justify-between gap-2">
              <Button variant="outline" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Enviar Comentario
              </Button>
              <div className="flex gap-1">
                <Button variant="outline" className="gap-1 text-red-600 hover:text-red-700">
                  <XCircle className="h-4 w-4" />
                  Rechazar
                </Button>
                <Button className="gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Aprobar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Documentos del Estudiante" />
      <main className="flex-1 p-4 md:p-6">
        <div className="mb-6">
          <Card>
            <CardHeader className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href="/documentos" className="text-sm text-muted-foreground hover:text-primary">
                      ← Volver a Documentos
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <CardTitle>{estudiante.nombre}</CardTitle>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {estudiante.estado}
                    </Badge>
                  </div>
                  <CardDescription>
                    {estudiante.programa} | Inscripción: {estudiante.fechaInscripcion}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2">
                    <History className="h-4 w-4" />
                    Historial
                  </Button>
                  <Button className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Aprobar Todo
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="obligatorios" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="obligatorios">Documentos Obligatorios</TabsTrigger>
            <TabsTrigger value="adicionales">Documentos Adicionales</TabsTrigger>
            <TabsTrigger value="todos">Todos los Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="obligatorios">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentosObligatorios.map((documento) => (
                <Card key={documento.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <documento.icono className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-base">{documento.nombre}</CardTitle>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          documento.estado === "aprobado"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : documento.estado === "pendiente"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        }
                      >
                        {documento.estado === "aprobado"
                          ? "Aprobado"
                          : documento.estado === "pendiente"
                            ? "Pendiente"
                            : "Rechazado"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Subido el {documento.fecha}
                      {documento.comentarios > 0 && (
                        <span className="ml-2 text-amber-600 dark:text-amber-400">
                          ({documento.comentarios} comentario{documento.comentarios > 1 ? "s" : ""})
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="relative aspect-[4/3] bg-muted">
                      <Image
                        src={documento.thumbnail || "/placeholder.svg"}
                        alt={documento.nombre}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    <div className="p-4 pt-3">
                      <Dialog
                        open={openModalId === documento.id}
                        onOpenChange={(open) => (open ? openModal(documento.id) : closeModal())}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full" onClick={() => openModal(documento.id)}>
                            Ver Documento
                          </Button>
                        </DialogTrigger>
                        {renderDocumentModal(documento)}
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="adicionales">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentosAdicionales.map((documento) => (
                <Card key={documento.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <documento.icono className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-base">{documento.nombre}</CardTitle>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          documento.estado === "aprobado"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : documento.estado === "pendiente"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        }
                      >
                        {documento.estado === "aprobado"
                          ? "Aprobado"
                          : documento.estado === "pendiente"
                            ? "Pendiente"
                            : "Rechazado"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Subido el {documento.fecha}
                      {documento.comentarios > 0 && (
                        <span className="ml-2 text-amber-600 dark:text-amber-400">
                          ({documento.comentarios} comentario{documento.comentarios > 1 ? "s" : ""})
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="relative aspect-[4/3] bg-muted">
                      <Image
                        src={documento.thumbnail || "/placeholder.svg"}
                        alt={documento.nombre}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    <div className="p-4 pt-3">
                      <Dialog
                        open={openModalId === documento.id}
                        onOpenChange={(open) => (open ? openModal(documento.id) : closeModal())}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full" onClick={() => openModal(documento.id)}>
                            Ver Documento
                          </Button>
                        </DialogTrigger>
                        {renderDocumentModal(documento)}
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="todos">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...documentosObligatorios, ...documentosAdicionales].map((documento) => (
                <Card key={documento.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <documento.icono className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-base">{documento.nombre}</CardTitle>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          documento.estado === "aprobado"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : documento.estado === "pendiente"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        }
                      >
                        {documento.estado === "aprobado"
                          ? "Aprobado"
                          : documento.estado === "pendiente"
                            ? "Pendiente"
                            : "Rechazado"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Subido el {documento.fecha}
                      {documento.comentarios > 0 && (
                        <span className="ml-2 text-amber-600 dark:text-amber-400">
                          ({documento.comentarios} comentario{documento.comentarios > 1 ? "s" : ""})
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="relative aspect-[4/3] bg-muted">
                      <Image
                        src={documento.thumbnail || "/placeholder.svg"}
                        alt={documento.nombre}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    <div className="p-4 pt-3">
                      <Dialog
                        open={openModalId === documento.id}
                        onOpenChange={(open) => (open ? openModal(documento.id) : closeModal())}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full" onClick={() => openModal(documento.id)}>
                            Ver Documento
                          </Button>
                        </DialogTrigger>
                        {renderDocumentModal(documento)}
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

