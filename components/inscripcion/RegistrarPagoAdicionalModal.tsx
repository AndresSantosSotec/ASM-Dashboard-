"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/utils/apiConfig"
import axios from "axios"
import {
  CreditCard,
  Upload,
  AlertCircle,
  Loader2,
  CheckCircle,
  FileText,
  X,
} from "lucide-react"

interface RegistrarPagoAdicionalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prospectoId: number
  estudianteProgramaId?: number
  prospectoNombre?: string
  onSuccess?: () => void
}

interface CuotaPendiente {
  id: number
  concepto: string
  mes: number
  ano: number
  monto: number
  estado: string
  estudiante_programa_id: number
  programa_nombre?: string
}

interface ProgramaInfo {
  id: number
  programa_id: number
  programa_nombre: string
}

interface FormData {
  modalidad: "libre" | "cuota"
  monto_pagado: string
  descripcion: string
  metodo_pago: string
  numero_boleta: string
  banco: string
  fecha_recibo: string
  cuota_id: string
  comprobante: File | null
}

const METODOS_PAGO = [
  { value: "transferencia", label: "Transferencia Bancaria" },
  { value: "deposito", label: "Depósito Bancario" },
  { value: "cheque", label: "Cheque" },
  { value: "efectivo", label: "Efectivo" },
]

const BANCOS_GT = [
  "Banco Industrial",
  "Banrural",
  "Banco G&T Continental",
  "BAM (Banco Agromercantil)",
  "Banco Promerica",
  "Bantrab",
  "Banco Inmobiliario",
  "Banco Internacional",
  "Vivibanco",
  "Banco Azteca",
  "Otro",
]

export default function RegistrarPagoAdicionalModal({
  open,
  onOpenChange,
  prospectoId,
  estudianteProgramaId,
  prospectoNombre = "Prospecto",
  onSuccess,
}: RegistrarPagoAdicionalModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [cuotasPendientes, setCuotasPendientes] = useState<CuotaPendiente[]>([])
  const [loadingCuotas, setLoadingCuotas] = useState(false)
  const [programas, setProgramas] = useState<ProgramaInfo[]>([])
  const [selectedProgramaId, setSelectedProgramaId] = useState<string>("")

  const [formData, setFormData] = useState<FormData>({
    modalidad: "libre",
    monto_pagado: "",
    descripcion: "Pago adicional",
    metodo_pago: "",
    numero_boleta: "",
    banco: "",
    fecha_recibo: new Date().toISOString().split("T")[0],
    cuota_id: "",
    comprobante: null,
  })

  const [archivoNombre, setArchivoNombre] = useState<string>("")

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setStep(1)
      setFormData({
        modalidad: "libre",
        monto_pagado: "",
        descripcion: "Pago adicional",
        metodo_pago: "",
        numero_boleta: "",
        banco: "",
        fecha_recibo: new Date().toISOString().split("T")[0],
        cuota_id: "",
        comprobante: null,
      })
      setArchivoNombre("")
      setCuotasPendientes([])
      setProgramas([])
      setSelectedProgramaId("")
    }
  }, [open])

  // Cargar cuotas pendientes cuando el modal se abre
  useEffect(() => {
    if (open && prospectoId) {
      cargarCuotasPendientes()
    }
  }, [open, prospectoId])

  const cargarCuotasPendientes = async () => {
    setLoadingCuotas(true)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get(
        `${API_BASE_URL}/api/prospectos/${prospectoId}/cuotas-pendientes`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      )

      if (response.data.success) {
        setCuotasPendientes(response.data.cuotas)

        // Capturar programas del endpoint
        const progs: ProgramaInfo[] = response.data.programas || []
        setProgramas(progs)

        // Auto-seleccionar si solo hay un programa
        if (progs.length === 1) {
          setSelectedProgramaId(progs[0].id.toString())
        } else if (estudianteProgramaId) {
          // Usar el prop como fallback si se proporcionó
          setSelectedProgramaId(estudianteProgramaId.toString())
        }
      }
    } catch (error: any) {
      console.error("Error al cargar cuotas pendientes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las cuotas pendientes",
        variant: "destructive",
      })
    } finally {
      setLoadingCuotas(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El comprobante no debe superar los 5MB",
          variant: "destructive",
        })
        return
      }

      // Validar tipo (solo imágenes y PDFs)
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de archivo no válido",
          description: "Solo se permiten imágenes (JPG, PNG) o archivos PDF",
          variant: "destructive",
        })
        return
      }

      setFormData({ ...formData, comprobante: file })
      setArchivoNombre(file.name)
    }
  }

  const handleRemoveFile = () => {
    setFormData({ ...formData, comprobante: null })
    setArchivoNombre("")
  }

  const handleModoChange = (modo: "libre" | "cuota") => {
    setFormData({
      ...formData,
      modalidad: modo,
      cuota_id: "",
      descripcion: modo === "libre" ? "Pago adicional" : "",
    })
  }

  const handleCuotaChange = (cuotaId: string) => {
    const cuota = cuotasPendientes.find((c) => c.id.toString() === cuotaId)
    if (cuota) {
      setFormData({
        ...formData,
        cuota_id: cuotaId,
        descripcion: cuota.concepto,
        monto_pagado: cuota.monto.toString(),
      })
      // Auto-resolver el estudiante_programa_id de la cuota seleccionada
      setSelectedProgramaId(cuota.estudiante_programa_id.toString())
    }
  }

  // Resolver el estudianteProgramaId: prop > seleccionado > auto
  const resolvedEstudianteProgramaId = estudianteProgramaId || (selectedProgramaId ? Number(selectedProgramaId) : undefined)

  const validateStep1 = (): boolean => {
    if (!resolvedEstudianteProgramaId) {
      toast({
        title: "Error de configuración",
        description: programas.length > 1
          ? "Seleccione el programa del estudiante."
          : "No se encontró el programa del estudiante. Asegúrese de que el prospecto tenga un programa asignado.",
        variant: "destructive",
      })
      return false
    }
    if (formData.modalidad === "cuota" && !formData.cuota_id) {
      toast({
        title: "Seleccione una cuota",
        description: "Debe seleccionar la cuota a la que desea aplicar el pago",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const validateStep2 = (): boolean => {
    if (!formData.monto_pagado || parseFloat(formData.monto_pagado) <= 0) {
      toast({
        title: "Monto inválido",
        description: "Ingrese un monto válido mayor a cero",
        variant: "destructive",
      })
      return false
    }

    if (!formData.descripcion.trim()) {
      toast({
        title: "Descripción requerida",
        description: "Ingrese una descripción para el pago",
        variant: "destructive",
      })
      return false
    }

    if (!formData.metodo_pago) {
      toast({
        title: "Método de pago requerido",
        description: "Seleccione el método de pago utilizado",
        variant: "destructive",
      })
      return false
    }

    if (!formData.numero_boleta.trim()) {
      toast({
        title: "Número de boleta requerido",
        description: "Ingrese el número de boleta del pago",
        variant: "destructive",
      })
      return false
    }

    if (!formData.banco) {
      toast({
        title: "Banco requerido",
        description: "Seleccione el banco del pago",
        variant: "destructive",
      })
      return false
    }

    if (!formData.fecha_recibo) {
      toast({
        title: "Fecha requerida",
        description: "Ingrese la fecha del pago",
        variant: "destructive",
      })
      return false
    }

    if (!formData.comprobante) {
      toast({
        title: "Comprobante requerido",
        description: "Debe adjuntar el comprobante de pago",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep2()) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const formDataToSend = new FormData()

      formDataToSend.append("estudiante_programa_id", resolvedEstudianteProgramaId!.toString())
      formDataToSend.append("modalidad", formData.modalidad)
      formDataToSend.append("monto_pagado", formData.monto_pagado)
      formDataToSend.append("descripcion", formData.descripcion)
      formDataToSend.append("metodo_pago", formData.metodo_pago)
      formDataToSend.append("numero_boleta", formData.numero_boleta)
      formDataToSend.append("banco", formData.banco)
      formDataToSend.append("fecha_recibo", formData.fecha_recibo)
      formDataToSend.append("comprobante", formData.comprobante!)

      if (formData.cuota_id) {
        formDataToSend.append("cuota_id", formData.cuota_id)
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/prospectos/${prospectoId}/pagos-adicionales`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      )

      if (response.data.success) {
        toast({
          title: "✅ Pago registrado exitosamente",
          description: `Se generó el recibo N° ${response.data.numero_boleta || "sin número"}`,
        })
        onOpenChange(false)
        onSuccess?.()
      }
    } catch (error: any) {
      console.error("Error al registrar pago:", error)
      const errorType = error.response?.data?.error_type
      const errorMsg = error.response?.data?.message || "No se pudo registrar el pago"
      
      // Mensaje específico para comprobante duplicado
      const isDuplicate = errorType === 'duplicate_receipt' || error.response?.status === 409
      
      toast({
        title: isDuplicate ? "⚠️ Comprobante duplicado" : "Error al registrar pago",
        description: isDuplicate 
          ? "Este comprobante ya fue registrado. Sube un archivo diferente o recarga la página para ver el pago existente."
          : `${errorMsg}. Intente nuevamente o recargue la página.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Registrar Pago Adicional
          </DialogTitle>
          <DialogDescription>
            Registre un pago adicional para <strong>{prospectoNombre}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className={`flex items-center gap-2 ${step === 1 ? "text-blue-600 font-bold" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
              1
            </div>
            <span>Tipo de Pago</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300" />
          <div className={`flex items-center gap-2 ${step === 2 ? "text-blue-600 font-bold" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
              2
            </div>
            <span>Detalles del Pago</span>
          </div>
        </div>

        {/* STEP 1: Selección de modo de pago */}
        {step === 1 && (
          <div className="space-y-6">
            {loadingCuotas ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Cargando datos...</span>
              </div>
            ) : programas.length === 0 && !estudianteProgramaId ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No se encontró el programa del estudiante. Asegúrese de que el prospecto tenga un programa asignado antes de registrar pagos adicionales.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Selector de programa si hay más de uno */}
                {programas.length > 1 && (
                  <div className="space-y-2">
                    <Label htmlFor="programa-select" className="text-base font-semibold">
                      Programa del Estudiante <span className="text-red-500">*</span>
                    </Label>
                    <Select value={selectedProgramaId} onValueChange={setSelectedProgramaId}>
                      <SelectTrigger id="programa-select">
                        <SelectValue placeholder="Seleccione un programa" />
                      </SelectTrigger>
                      <SelectContent>
                        {programas.map((prog) => (
                          <SelectItem key={prog.id} value={prog.id.toString()}>
                            {prog.programa_nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {programas.length === 1 && (
                  <div className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">
                    <strong>Programa:</strong> {programas[0].programa_nombre}
                  </div>
                )}
            
            <div>
              <Label className="text-base font-semibold mb-3 block">
                ¿Cómo desea registrar este pago?
              </Label>
              <RadioGroup
                value={formData.modalidad}
                onValueChange={(value) => handleModoChange(value as "libre" | "cuota")}
              >
                <Card className={`cursor-pointer transition-all ${formData.modalidad === "libre" ? "border-blue-600 border-2 bg-blue-50" : ""}`}
                  onClick={() => handleModoChange("libre")}
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="libre" id="modo-libre" />
                      <div className="flex-1">
                        <CardTitle className="text-base">Pago Libre</CardTitle>
                        <CardDescription className="mt-1">
                          Registrar un pago adicional sin asociarlo a ninguna cuota específica.
                          Este monto quedará registrado en el kardex del estudiante.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className={`cursor-pointer transition-all ${formData.modalidad === "cuota" ? "border-blue-600 border-2 bg-blue-50" : ""}`}
                  onClick={() => handleModoChange("cuota")}
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="cuota" id="modo-cuota" />
                      <div className="flex-1">
                        <CardTitle className="text-base">Aplicar a Cuota Pendiente</CardTitle>
                        <CardDescription className="mt-1">
                          Asociar este pago a una cuota específica que esté pendiente.
                          La cuota quedará marcada como pagada.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </RadioGroup>
            </div>

            {/* Selector de cuota (solo si modo = cuota) */}
            {formData.modalidad === "cuota" && (
              <div className="space-y-2">
                <Label htmlFor="cuota-select">Seleccionar Cuota Pendiente</Label>
                {(() => {
                  // Filtrar cuotas por programa seleccionado si hay múltiples
                  const cuotasFiltradas = selectedProgramaId
                    ? cuotasPendientes.filter((c) => c.estudiante_programa_id.toString() === selectedProgramaId)
                    : cuotasPendientes
                  
                  if (cuotasFiltradas.length === 0) {
                    return (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No hay cuotas pendientes para este prospecto.
                          Puede registrar un pago libre.
                        </AlertDescription>
                      </Alert>
                    )
                  }

                  return (
                    <Select value={formData.cuota_id} onValueChange={handleCuotaChange}>
                      <SelectTrigger id="cuota-select">
                        <SelectValue placeholder="Seleccione una cuota" />
                      </SelectTrigger>
                      <SelectContent>
                        {cuotasFiltradas.map((cuota) => (
                          <SelectItem key={cuota.id} value={cuota.id.toString()}>
                            {cuota.concepto} - {cuota.mes}/{cuota.ano} - Q{Number(cuota.monto || 0).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                })()}
              </div>
            )}
              </>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleNextStep} disabled={loadingCuotas}>
                Siguiente
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 2: Detalles del pago */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Concepto */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">
                Descripción del Pago <span className="text-red-500">*</span>
              </Label>
              <Input
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Ej: Pago de cuota mensual, abono a matrícula"
                disabled={formData.modalidad === "cuota" && !!formData.cuota_id}
              />
            </div>

            {/* Monto y Fecha */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monto_pagado">
                  Monto (Q) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="monto_pagado"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monto_pagado}
                  onChange={(e) => setFormData({ ...formData, monto_pagado: e.target.value })}
                  placeholder="0.00"
                  disabled={formData.modalidad === "cuota" && !!formData.cuota_id}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_recibo">
                  Fecha de Pago <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fecha_recibo"
                  type="date"
                  value={formData.fecha_recibo}
                  onChange={(e) => setFormData({ ...formData, fecha_recibo: e.target.value })}
                />
              </div>
            </div>

            {/* Método de Pago */}
            <div className="space-y-2">
              <Label htmlFor="metodo_pago">
                Método de Pago <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.metodo_pago}
                onValueChange={(value) => setFormData({ ...formData, metodo_pago: value })}
              >
                <SelectTrigger id="metodo_pago">
                  <SelectValue placeholder="Seleccione método de pago" />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map((metodo) => (
                    <SelectItem key={metodo.value} value={metodo.value}>
                      {metodo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Banco y Número de Boleta */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banco">Banco <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.banco}
                  onValueChange={(value) => setFormData({ ...formData, banco: value })}
                >
                  <SelectTrigger id="banco">
                    <SelectValue placeholder="Seleccione banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANCOS_GT.map((banco) => (
                      <SelectItem key={banco} value={banco}>
                        {banco}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero_boleta">Número de Boleta <span className="text-red-500">*</span></Label>
                <Input
                  id="numero_boleta"
                  value={formData.numero_boleta}
                  onChange={(e) => setFormData({ ...formData, numero_boleta: e.target.value })}
                  placeholder="Ej: 123456789"
                />
              </div>
            </div>

            {/* Comprobante de Pago */}
            <div className="space-y-2">
              <Label htmlFor="archivo">Comprobante de Pago <span className="text-red-500">*</span></Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById("archivo")?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {archivoNombre || "Seleccionar archivo"}
                </Button>
                <input
                  id="archivo"
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {formData.comprobante && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {archivoNombre && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Archivo seleccionado: {archivoNombre}</span>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Anterior
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar Pago"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
