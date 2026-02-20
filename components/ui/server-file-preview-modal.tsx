"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, X, Loader2, FileText, Image as ImageIcon, ZoomIn, ZoomOut, RotateCw } from "lucide-react"

interface ServerFilePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  /** URL completa del archivo en el servidor */
  fileUrl: string | null
  /** Nombre del archivo para mostrar y para descargar */
  fileName: string
  /** Tipo de documento (dpi, inscripcion, etc.) */
  tipoDocumento?: string
  /** Estado del documento (pendiente, aprobado, rechazado) */
  estado?: string
  /** Token de autenticación (si se necesita para la descarga) */
  authToken?: string | null
}

export function ServerFilePreviewModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  tipoDocumento,
  estado,
  authToken,
}: ServerFilePreviewModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  // Determinar tipo de archivo
  const extension = fileName?.split(".").pop()?.toLowerCase() || ""
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(extension)
  const isPDF = extension === "pdf"

  // Limpiar blob URL al cerrar
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [blobUrl])

  // Cargar archivo desde el servidor cuando se abre el modal
  useEffect(() => {
    if (!isOpen || !fileUrl) {
      setLoading(false)
      setError(false)
      setBlobUrl(null)
      setZoom(1)
      setRotation(0)
      return
    }

    setLoading(true)
    setError(false)
    setZoom(1)
    setRotation(0)

    const fetchFile = async () => {
      try {
        const headers: Record<string, string> = {}
        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`
        }

        const res = await fetch(fileUrl, { headers })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setBlobUrl(url)
      } catch (err) {
        console.error("Error al cargar vista previa:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchFile()
  }, [isOpen, fileUrl, authToken])

  const handleDownload = useCallback(() => {
    if (!blobUrl) return
    const link = document.createElement("a")
    link.href = blobUrl
    link.download = fileName || "documento"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [blobUrl, fileName])

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25))
  const handleRotate = () => setRotation((r) => (r + 90) % 360)

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      dpi: "DPI (ambos lados)",
      recibo: "Recibo de luz o teléfono",
      american: "Recibo de American",
      inscripcion: "Boleta de Inscripción",
      foto: "Fotografía reciente",
      titulo: "Título o Diploma",
      cierrePensum: "Cierre de Pénsum",
      certificacionCursos: "Certificación de cursos",
      carnetColaborador: "Carnet de Colaborador",
      autorizacionAcademica: "Autorización Académica",
      autorizacionFinanciera: "Autorización Financiera",
      autorizacionAsociaciones: "Autorización Asociaciones",
      valeDescuento: "Vale de Descuento",
      mensajeFinal: "Mensaje Final",
      otros: "Otros documentos",
    }
    return labels[tipo] || tipo
  }

  const estadoColor =
    estado === "aprobado"
      ? "bg-green-50 text-green-700 border-green-200"
      : estado === "rechazado"
        ? "bg-red-50 text-red-700 border-red-200"
        : "bg-yellow-50 text-yellow-700 border-yellow-200"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`p-2 rounded-lg flex-shrink-0 ${isImage ? "bg-purple-100" : isPDF ? "bg-red-100" : "bg-blue-100"}`}>
                {isImage ? (
                  <ImageIcon className="h-5 w-5 text-purple-600" />
                ) : (
                  <FileText className={`h-5 w-5 ${isPDF ? "text-red-600" : "text-blue-600"}`} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-base">{fileName}</DialogTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  {tipoDocumento && (
                    <span className="text-xs text-gray-500">{getTipoLabel(tipoDocumento)}</span>
                  )}
                  {estado && (
                    <>
                      <span className="text-xs text-gray-300">•</span>
                      <Badge variant="outline" className={`text-[10px] ${estadoColor}`}>
                        {estado}
                      </Badge>
                    </>
                  )}
                  <span className="text-xs text-gray-300">•</span>
                  <span className="text-xs text-gray-400 uppercase">{extension}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0 ml-4">
              {/* Controles de zoom/rotación para imágenes */}
              {isImage && blobUrl && !loading && !error && (
                <>
                  <Button variant="ghost" size="icon" onClick={handleZoomOut} title="Reducir">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
                  <Button variant="ghost" size="icon" onClick={handleZoomIn} title="Ampliar">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleRotate} title="Rotar">
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-6 bg-gray-200 mx-1" />
                </>
              )}
              {blobUrl && (
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1.5" />
                  Descargar
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="overflow-auto bg-gray-100" style={{ maxHeight: "calc(95vh - 100px)" }}>
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="h-10 w-10 animate-spin mb-3 text-blue-500" />
              <p className="text-sm">Cargando vista previa...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <FileText className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-sm font-medium text-gray-700">No se pudo cargar la vista previa</p>
              <p className="text-xs text-gray-400 mt-1">Intente descargar el archivo directamente</p>
              {fileUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => window.open(fileUrl, "_blank")}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Abrir en nueva pestaña
                </Button>
              )}
            </div>
          )}

          {!loading && !error && blobUrl && (
            <>
              {isImage && (
                <div className="flex items-center justify-center p-6 min-h-[400px]">
                  <img
                    src={blobUrl}
                    alt={fileName}
                    className="max-w-full h-auto rounded shadow-lg transition-transform duration-200"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transformOrigin: "center center",
                    }}
                    onError={() => setError(true)}
                  />
                </div>
              )}

              {isPDF && (
                <iframe
                  src={blobUrl}
                  className="w-full border-0"
                  style={{ height: "calc(95vh - 110px)" }}
                  title={`Vista previa: ${fileName}`}
                />
              )}

              {!isImage && !isPDF && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <FileText className="h-12 w-12 mb-3 opacity-40" />
                  <p className="text-sm font-medium text-gray-700">
                    Vista previa no disponible para archivos .{extension}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Solo se admite vista previa para imágenes y PDF
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-1.5" />
                    Descargar archivo
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
