"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SimpleDatePicker } from "@/components/ui/simple-date-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle, Loader2, X, Eye } from "lucide-react"
import { FilePreviewModal } from "@/components/ui/file-preview-modal"
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
  prospectoId: number
  estudianteProgramaId?: number
  montoInscripcion: number
  descuentoInscripcion?: boolean
  onBoletaSubida?: () => void
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

export default function BoletaInscripcionUpload({
  prospectoId,
  estudianteProgramaId,
  montoInscripcion,
  descuentoInscripcion = false,
  onBoletaSubida
}: Props) {
  const [datos, setDatos] = useState<BoletaInscripcionData>({
    numeroBoleta: "",
    banco: "",
    monto: montoInscripcion > 0 ? montoInscripcion.toString() : "",
    fechaRecibo: "",
    archivo: null
  })

  // Sincronizar monto cuando cambia el prop montoInscripcion (e.g. al cargar precios del API)
  const prevMontoRef = useRef(montoInscripcion)
  useEffect(() => {
    if (montoInscripcion !== prevMontoRef.current && montoInscripcion > 0) {
      setDatos(prev => ({ ...prev, monto: montoInscripcion.toString() }))
      prevMontoRef.current = montoInscripcion
    }
  }, [montoInscripcion])

  const archivoRef = useRef<File | null>(null) // 🔥 Evita el doble upload

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [boletaSubida, setBoletaSubida] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamaño (máx 5MB)
    if (file.size > 100 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "Archivo muy grande",
        text: "El archivo no debe superar los 100MB"
      })
      e.target.value = "" // Limpiar input
      return
    }

    // Validar tipo
    const validTypes = ["application/pdf", "image/jpeg", "image/png"]
    if (!validTypes.includes(file.type)) {
      Swal.fire("Error", "Solo se aceptan archivos PDF, JPG o PNG", "error")
      e.target.value = "" // Limpiar input
      return
    }

    // Guardar la referencia estable del archivo (NO se borra con re-render)
    archivoRef.current = file

    // Solo para mostrar en UI
    setDatos(prev => ({ ...prev, archivo: file }))

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    e.target.value = ""
  }

  const handleRemoveFile = () => {
    archivoRef.current = null
    setDatos(prev => ({ ...prev, archivo: null }))
    setPreviewUrl(null)

    // Limpiar también el input file
    const inputElement = document.getElementById("comprobante") as HTMLInputElement
    if (inputElement) {
      inputElement.value = ""
    }
  }

  const handleSubmit = async () => {
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
    if (montoInscripcion > 0 && parseFloat(datos.monto) > montoInscripcion) {
      await Swal.fire({
        icon: "warning",
        title: "Monto mayor al esperado",
        text: `El monto ingresado supera la inscripción (Q${montoInscripcion.toFixed(2)}). ¿Desea continuar?`,
        showCancelButton: true,
        confirmButtonText: "Sí, continuar",
        cancelButtonText: "Cancelar"
      }).then(result => {
        if (!result.isConfirmed) {
          throw new Error("Operación cancelada por el usuario.")
        }
      })
    }
    if (!datos.fechaRecibo) {
      Swal.fire("Error", "Seleccione la fecha del recibo", "error")
      return
    }
    if (!archivoRef.current) {
      Swal.fire("Error", "Debe adjuntar el comprobante de pago", "error")
      return
    }

    setIsUploading(true)

    try {
      // Verificar que el archivo todavía existe antes de enviar
      if (!archivoRef.current) {
        throw new Error("El archivo se perdió. Por favor, vuelva a seleccionarlo.")
      }

      const formData = new FormData()
      formData.append("prospecto_id", prospectoId.toString())
      formData.append("tipo_documento", "inscripcion")
      formData.append("file", archivoRef.current)

      // Guardar datos de la boleta como metadata
      formData.append("metadata", JSON.stringify({
        numero_boleta: datos.numeroBoleta.trim(),
        banco: datos.banco,
        monto: datos.monto,
        fecha_recibo: datos.fechaRecibo,
        metodo_pago: "transferencia",
        descuento_inscripcion: descuentoInscripcion
      }))

      console.log("📤 Guardando boleta como documento:", archivoRef.current.name)

      const token = localStorage.getItem("token") || sessionStorage.getItem("token")
      const response = await axios.post(
        `${API_BASE_URL}/api/documentos`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          }
        }
      )

      console.log("✅ Documento guardado:", response.data)

      setBoletaSubida(true)

      await Swal.fire({
        icon: "success",
        title: "Boleta guardada",
        html: `
          <p>El comprobante de pago fue guardado correctamente.</p>
          <p class="text-sm text-gray-600 mt-2">
            ℹ️ El pago se procesará al finalizar la inscripción
          </p>
        `,
        timer: 3000,
        showConfirmButton: true
      })

      if (onBoletaSubida) onBoletaSubida()
    } catch (error: any) {
      console.error("❌ Error al subir boleta:", error)
      console.error("❌ Error completo:", error.response || error)
      
      let errorMessage = "Ocurrió un error al procesar la boleta"
      
      if (error.response) {
        // Error del servidor
        errorMessage = error.response.data?.message || error.response.data?.error || `Error del servidor: ${error.response.status}`
        
        // Si es error 413 (Payload Too Large) o 500, puede ser por tamaño de archivo
        if (error.response.status === 413 || error.response.status === 500) {
          errorMessage += "\n\nPosible causa: El archivo es muy grande o el servidor no puede procesarlo. Intente con un archivo más pequeño o en formato PDF comprimido."
        }
      } else if (error.request) {
        // No hay respuesta del servidor
        errorMessage = "No se pudo conectar con el servidor. Verifique su conexión a internet."
      } else {
        // Error al configurar la petición
        errorMessage = error.message || errorMessage
      }
      
      await Swal.fire({
        icon: "error",
        title: "Error al subir boleta",
        html: `<p>${errorMessage}</p>`,
        confirmButtonText: "Entendido"
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (boletaSubida) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3 text-green-700">
          <CheckCircle className="h-6 w-6" />
          <div>
            <p className="font-semibold">Boleta de inscripción registrada</p>
            <p className="text-sm">El pago fue procesado correctamente y la cuota 0 está marcada como pagada</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">

        {/* Comprobante */}
        <div className="space-y-2">
          <Label>Comprobante de Pago <span className="text-red-500">*</span></Label>

          {!datos.archivo ? (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-400 cursor-pointer"
              onClick={() => document.getElementById("comprobante")?.click()}
            >
              <Upload className="mx-auto h-16 w-16 text-blue-400" />
              <p className="mt-2 text-sm text-gray-600">Arrastra un archivo o haz clic para seleccionar</p>
              <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (máx. 100MB)</p>

              <input
                id="comprobante"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileChange}
              />

              <Button variant="outline" className="mt-3">Seleccionar archivo</Button>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">{datos.archivo.name}</p>
                    <p className="text-xs text-gray-500">{(datos.archivo.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowPreview(true)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {previewUrl && (
                <div className="mt-4 space-y-2">
                  <Label className="text-sm font-medium">Vista Previa</Label>

                  {datos.archivo.type.startsWith("image/") ? (
                    <img src={previewUrl} className="w-full max-h-64 object-contain rounded-lg border" />
                  ) : (
                    <iframe src={previewUrl} className="w-full h-96 border rounded-lg" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Número de boleta */}
        <div>
          <Label>Número de Boleta/Referencia <span className="text-red-500">*</span></Label>
          <Input
            placeholder="Ej: 123456789"
            value={datos.numeroBoleta}
            onChange={(e) => setDatos({ ...datos, numeroBoleta: e.target.value })}
          />
        </div>

        {/* Banco */}
        <div>
          <Label>Banco <span className="text-red-500">*</span></Label>
          <Select
            value={datos.banco}
            onValueChange={(v) => setDatos({ ...datos, banco: v })}
          >
            <SelectTrigger><SelectValue placeholder="Seleccione el banco" /></SelectTrigger>
            <SelectContent>
              {BANCOS.map((banco) => (
                <SelectItem key={banco} value={banco}>{banco}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Monto */}
        <div>
          <Label>Monto (Q) <span className="text-red-500">*</span></Label>
          <Input
            type="number"
            min="0"
            max={montoInscripcion > 0 ? montoInscripcion : undefined}
            value={datos.monto}
            onChange={(e) => setDatos({ ...datos, monto: e.target.value })}
          />

          {montoInscripcion > 0 && parseFloat(datos.monto) < montoInscripcion && parseFloat(datos.monto) > 0 && !descuentoInscripcion && (
            <Alert className="mt-2">
              <AlertDescription>
                ⚠️ Pago parcial — Pendiente: Q{(montoInscripcion - parseFloat(datos.monto)).toFixed(2)}
              </AlertDescription>
            </Alert>
          )}

          {descuentoInscripcion && parseFloat(datos.monto) > 0 && montoInscripcion > 0 && parseFloat(datos.monto) >= montoInscripcion && (
            <Alert className="mt-2 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                ✅ Inscripción con descuento — Pago completo
              </AlertDescription>
            </Alert>
          )}

          {descuentoInscripcion && parseFloat(datos.monto) > 0 && montoInscripcion > 0 && parseFloat(datos.monto) < montoInscripcion && (
            <Alert className="mt-2">
              <AlertDescription>
                ⚠️ El monto es menor al precio con descuento (Q{montoInscripcion.toFixed(2)}) — Pendiente: Q{(montoInscripcion - parseFloat(datos.monto)).toFixed(2)}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Fecha */}
        <div>
          <Label>Fecha del Recibo <span className="text-red-500">*</span></Label>
          <SimpleDatePicker
            value={datos.fechaRecibo}
            onChange={(v) => setDatos({ ...datos, fechaRecibo: v })}
            placeholder="dd/mm/aaaa"
          />
        </div>

        {/* Info */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription>
            <strong>Importante:</strong> El comprobante se guardará temporalmente. El pago se procesará y la cuota 0 se marcará como pagada al finalizar la inscripción.
          </AlertDescription>
        </Alert>

        {/* Botón */}
        <Button className="w-full" onClick={handleSubmit} disabled={isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando boleta...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Guardar Comprobante
            </>
          )}
        </Button>
      </div>

      <FilePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        file={archivoRef.current}
        previewUrl={previewUrl}
      />
    </div>
  )
}
