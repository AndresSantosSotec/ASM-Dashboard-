"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SimpleDatePicker } from "@/components/ui/simple-date-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle, Loader2, X, Eye } from "lucide-react"
import axios from "axios"
import { API_BASE_URL } from "@/utils/apiConfig"
import Swal from "sweetalert2"

interface BoletaInscripcionData {
  numeroBoleta: string
  banco: string
  monto: string
  fechaRecibo: string
  archivo: File | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  prospectoId: number
  estudianteProgramaId?: number
  montoInscripcion: number
  onBoletaRegistrada: () => void
}

const BANCOS = [
  "Banco Industrial",
  "Banrural",
  "BAM",
  "G&T Continental",
  "Promerica",
  "Banco Agromercantil",
  "BAC",
  "Bantrab",
  "Vivibanco",
  "Banco Internacional",
  "Otro"
]

export default function BoletaInscripcionModal({
  isOpen,
  onClose,
  prospectoId,
  estudianteProgramaId,
  montoInscripcion,
  onBoletaRegistrada
}: Props) {
  const [datos, setDatos] = useState<BoletaInscripcionData>({
    numeroBoleta: "",
    banco: "",
    monto: montoInscripcion.toString(),
    fechaRecibo: "",
    archivo: null
  })

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamaño (máx 5MB)
    if (file.size > 100 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "Archivo demasiado grande",
        text: "El archivo excede el límite de 100MB.",
      })
      return
    }

    // Validar tipo
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if (!validTypes.includes(file.type)) {
      Swal.fire({
        icon: "error",
        title: "Formato no válido",
        text: "Solo se aceptan archivos PDF, JPG o PNG"
      })
      return
    }

    setDatos({ ...datos, archivo: file })

    // Crear preview
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleRemoveFile = () => {
    setDatos({ ...datos, archivo: null })
    setPreviewUrl(null)
  }

  const handleSubmit = async () => {
    // Validaciones
    if (!datos.numeroBoleta.trim()) {
      Swal.fire("Error", "Ingrese el número de boleta", "error")
      return
    }
    if (!datos.banco) {
      Swal.fire("Error", "Seleccione el banco", "error")
      return
    }
    if (!datos.monto || parseFloat(datos.monto) <= 0) {
      Swal.fire("Error", "Ingrese un monto válido", "error")
      return
    }
    if (parseFloat(datos.monto) > montoInscripcion) {
      Swal.fire("Error", `El monto no puede exceder Q${montoInscripcion.toFixed(2)}`, "error")
      return
    }
    if (!datos.fechaRecibo) {
      Swal.fire("Error", "Seleccione la fecha del recibo", "error")
      return
    }
    if (!datos.archivo) {
      Swal.fire("Error", "Debe adjuntar el comprobante de pago", "error")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("prospecto_id", prospectoId.toString())
      if (estudianteProgramaId) {
        formData.append("estudiante_programa_id", estudianteProgramaId.toString())
      }
      formData.append("numero_boleta", datos.numeroBoleta.trim())
      formData.append("banco", datos.banco)
      formData.append("monto_pagado", datos.monto)
      formData.append("fecha_recibo", datos.fechaRecibo)
      formData.append("metodo_pago", "transferencia")
      formData.append("tipo_documento", "inscripcion")
      formData.append("file", datos.archivo)

      const response = await axios.post(
        `${API_BASE_URL}/api/pagos/boleta-inscripcion`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        }
      )

      await Swal.fire({
        icon: "success",
        title: "Boleta registrada",
        html: `
          <p>La boleta de inscripción fue registrada correctamente.</p>
          <p class="text-sm text-gray-600 mt-2">
            ${response.data.cuota_pagada ? '✅ Cuota de inscripción marcada como pagada' : '⚠️ Pago parcial registrado'}
          </p>
        `,
        confirmButtonText: "Aceptar"
      })

      onBoletaRegistrada()
      onClose()

    } catch (error: any) {
      console.error("Error al subir boleta:", error)
      Swal.fire({
        icon: "error",
        title: "Error al registrar boleta",
        text: error.response?.data?.message || "Ocurrió un error al procesar la boleta"
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Registrar Boleta de Inscripción
          </DialogTitle>
          <DialogDescription>
            Complete los datos del comprobante de pago de la cuota de inscripción
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Número de Boleta */}
          <div className="space-y-2">
            <Label htmlFor="numeroBoleta">
              Número de Boleta/Referencia <span className="text-red-500">*</span>
            </Label>
            <Input
              id="numeroBoleta"
              placeholder="Ej: 123456789"
              value={datos.numeroBoleta}
              onChange={(e) => setDatos({ ...datos, numeroBoleta: e.target.value })}
            />
          </div>

          {/* Banco */}
          <div className="space-y-2">
            <Label htmlFor="banco">
              Banco <span className="text-red-500">*</span>
            </Label>
            <Select value={datos.banco} onValueChange={(v) => setDatos({ ...datos, banco: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione el banco" />
              </SelectTrigger>
              <SelectContent>
                {BANCOS.map((banco) => (
                  <SelectItem key={banco} value={banco}>
                    {banco}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="monto">
              Monto (Q) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="monto"
              type="number"
              step="0.01"
              min="0"
              max={montoInscripcion}
              value={datos.monto}
              onChange={(e) => setDatos({ ...datos, monto: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Máximo permitido: Q{montoInscripcion.toFixed(2)}
            </p>
            {parseFloat(datos.monto) < montoInscripcion && parseFloat(datos.monto) > 0 && (
              <Alert>
                <AlertDescription className="text-sm">
                  ⚠️ Pago parcial. Pendiente: Q{(montoInscripcion - parseFloat(datos.monto)).toFixed(2)}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Fecha del Recibo */}
          <div className="space-y-2">
            <Label htmlFor="fechaRecibo">
              Fecha del Recibo <span className="text-red-500">*</span>
            </Label>
            <SimpleDatePicker
              value={datos.fechaRecibo}
              onChange={(v) => setDatos({ ...datos, fechaRecibo: v })}
              placeholder="dd/mm/aaaa"
            />
            <p className="text-xs text-muted-foreground">
              Seleccione la fecha en que fue emitido el recibo o boleta
            </p>
          </div>

          {/* Comprobante de Pago */}
          <div className="space-y-2">
            <Label htmlFor="comprobante">
              Comprobante de Pago <span className="text-red-500">*</span>
            </Label>

            {!datos.archivo ? (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Arrastra un archivo o haz clic para seleccionar
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, JPG, PNG (máx. 5MB)
                </p>
                <input
                  id="comprobante"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  variant="outline"
                  className="mt-3"
                  type="button"
                  onClick={() => document.getElementById("comprobante")?.click()}
                >
                  Seleccionar archivo
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">{datos.archivo.name}</p>
                      <p className="text-xs text-gray-500">
                        {(datos.archivo.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {previewUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => window.open(previewUrl, "_blank")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Vista previa de imagen */}
                {previewUrl && (
                  <div className="mt-3">
                    <img
                      src={previewUrl}
                      alt="Vista previa"
                      className="max-h-48 mx-auto rounded border"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Procesamiento Automático */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-sm">
              <strong>Procesamiento Automático:</strong> Su pago será procesado automáticamente
              una vez que suba el comprobante. La cuota de inscripción se marcará como pagada
              inmediatamente si el monto coincide.
            </AlertDescription>
          </Alert>
        </div>

        {/* Botones */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Registrar Boleta
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
