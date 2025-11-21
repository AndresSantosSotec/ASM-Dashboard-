"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SimpleDatePicker } from "@/components/ui/simple-date-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Upload, FileText, Loader2, Eye, X } from "lucide-react"
import { API_BASE_URL } from "@/utils/apiConfig"
import Swal from "sweetalert2"
import axios from "axios"
import { FilePreviewModal } from "@/components/ui/file-preview-modal"

interface AlertaAlumnoNuevoProps {
  prospectoId: string
  prospectoNombre: string
  onClose: () => void
  onSuccess?: () => void
}

const API_URL = `${API_BASE_URL}/api`

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

export default function AlertaAlumnoNuevo({
  prospectoId,
  prospectoNombre,
  onClose,
  onSuccess,
}: AlertaAlumnoNuevoProps) {
  const [activeTab, setActiveTab] = useState("validacion")
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  
  // Estados de validación
  const [datosFaltantes, setDatosFaltantes] = useState<string[]>([])
  const [prospectoData, setProspectoData] = useState<any>(null)
  const [tieneCarnet, setTieneCarnet] = useState(false)
  const [carnetGenerado, setCarnetGenerado] = useState<string>("")
  const [programaData, setProgramaData] = useState<any>(null)
  const [montoInscripcion, setMontoInscripcion] = useState(0)
  
  // Estados de datos faltantes
  const [formData, setFormData] = useState({
    nombre_completo: "",
    correo_electronico: "",
    numero_identificacion: "",
    telefono: "",
    modalidad: "",
    fecha_inicio_especifica: "",
    programa_id: "",
    duracion_meses: "",
  })
  
  // Estados para programas académicos
  const [programasAcademicos, setProgramasAcademicos] = useState<any[]>([])
  const [loadingProgramas, setLoadingProgramas] = useState(false)
  
  // Estados de boleta
  const [boletaData, setBoletaData] = useState({
    numeroBoleta: "",
    banco: "",
    monto: "",
    fechaRecibo: "",
    archivo: null as File | null,
  })
  const [archivoRef, setArchivoRef] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [boletaSubida, setBoletaSubida] = useState(false)

  // Cargar programas académicos
  useEffect(() => {
    const cargarProgramas = async () => {
      try {
        setLoadingProgramas(true)
        const token = localStorage.getItem("token")
        
        const res = await fetch(`${API_URL}/programas`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        
        if (res.ok) {
          const data = await res.json()
          setProgramasAcademicos(Array.isArray(data) ? data : data.data || [])
        }
      } catch (err) {
        console.error("Error cargando programas:", err)
      } finally {
        setLoadingProgramas(false)
      }
    }
    
    cargarProgramas()
  }, [])

  // Cargar datos iniciales del prospecto
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const token = localStorage.getItem("token")
        
        // Cargar prospecto
        const res = await fetch(`${API_URL}/prospectos/${prospectoId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        if (!res.ok) throw new Error("Error al cargar prospecto")
        
        const { data } = await res.json()
        setProspectoData(data)
        setTieneCarnet(!!data.carnet)
        setCarnetGenerado(data.carnet || "")
        
        // Cargar programa académico
        if (data.programas && data.programas.length > 0) {
          const programa = data.programas[0]
          setProgramaData(programa)
          setMontoInscripcion(parseFloat(programa.inscripcion) || 0)
          
          // Llenar datos del programa en el formulario
          if (programa.programa_id) {
            setFormData(prev => ({
              ...prev,
              programa_id: programa.programa_id.toString(),
              duracion_meses: programa.duracion_meses?.toString() || programa.programa?.meses?.toString() || "",
            }))
          }
        }
        
        // Llenar formulario con datos existentes
        setFormData(prev => ({
          ...prev,
          nombre_completo: data.nombre_completo || "",
          correo_electronico: data.correo_electronico || "",
          numero_identificacion: data.numero_identificacion || "",
          telefono: data.telefono || "",
          modalidad: data.modalidad || "",
          fecha_inicio_especifica: data.fecha_inicio_especifica || "",
        }))
        
        // Validar datos mínimos
        await validarDatosMinimos()
        
      } catch (err) {
        console.error("Error cargando datos:", err)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los datos del prospecto",
        })
      } finally {
        setLoadingData(false)
      }
    }
    
    cargarDatos()
  }, [prospectoId])
  
  // Actualizar duración cuando se selecciona un programa
  useEffect(() => {
    if (formData.programa_id) {
      const programaSeleccionado = programasAcademicos.find(p => p.id.toString() === formData.programa_id)
      if (programaSeleccionado && programaSeleccionado.meses) {
        setFormData(prev => ({
          ...prev,
          duracion_meses: programaSeleccionado.meses.toString(),
        }))
      }
    }
  }, [formData.programa_id, programasAcademicos])

  const validarDatosMinimos = async () => {
    try {
      const token = localStorage.getItem("token")
      
      const res = await fetch(`${API_URL}/alerta-alumno-nuevo/validar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prospecto_id: Number(prospectoId) }),
      })
      
      const data = await res.json()
      
      if (!res.ok && data.tipo === "datos_faltantes") {
        setDatosFaltantes(data.faltantes || [])
      } else {
        setDatosFaltantes([])
      }
      
      // Nota: Los datos de la ficha completa se validarán después, no aquí
      
      // Verificar carnet
      if (data.necesita_carnet) {
        setTieneCarnet(false)
      }
      
    } catch (err) {
      console.error("Error validando:", err)
    }
  }

  const generarCarnet = async () => {
    try {
      const token = localStorage.getItem("token")
      
      const res = await fetch(`${API_URL}/alerta-alumno-nuevo/generar-carnet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prospecto_id: Number(prospectoId) }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || "Error al generar el carnet")
      }
      
      setCarnetGenerado(data.carnet)
      setTieneCarnet(true)
      
      await Swal.fire({
        icon: "success",
        title: "Carnet generado",
        html: `<p>Carnet generado: <strong>${data.carnet}</strong></p>`,
        timer: 2000,
        showConfirmButton: false,
      })
      
    } catch (err: any) {
      console.error("Error generando carnet:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo generar el carnet",
      })
    }
  }

  const guardarDatosFaltantes = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      
      const payload: any = {}
      
      if (datosFaltantes.includes("Nombre completo") && formData.nombre_completo) {
        payload.nombreCompleto = formData.nombre_completo
      }
      
      if (datosFaltantes.includes("Correo electrónico") && formData.correo_electronico) {
        payload.correoElectronico = formData.correo_electronico
      }
      
      // DPI - Siempre enviar si tiene valor
      if (formData.numero_identificacion) {
        payload.numeroIdentificacion = formData.numero_identificacion
      }
      
      if (datosFaltantes.includes("Teléfono") && formData.telefono) {
        payload.telefono = formData.telefono
      }
      
      if (datosFaltantes.includes("Modalidad") && formData.modalidad) {
        payload.modalidad = formData.modalidad
      }
      
      if (datosFaltantes.includes("Fecha de inicio del programa") && formData.fecha_inicio_especifica) {
        payload.fechaInicioEspecifica = formData.fecha_inicio_especifica
      }
      
      // Si se seleccionó un programa académico y hay duración, crear/actualizar estudiante_programa
      if (formData.programa_id && formData.duracion_meses) {
        try {
          // Verificar si ya existe un estudiante_programa
          const resEP = await fetch(`${API_URL}/estudiante-programa?prospecto_id=${prospectoId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          
          let estudianteProgramaId = null
          if (resEP.ok) {
            const epData = await resEP.json()
            if (epData && epData.length > 0) {
              estudianteProgramaId = epData[0].id
            }
          }
          
          const epPayload: any = {
            prospecto_id: Number(prospectoId),
            programa_id: Number(formData.programa_id),
            duracion_meses: Number(formData.duracion_meses),
            fecha_inicio: formData.fecha_inicio_especifica || new Date().toISOString().split('T')[0],
          }
          
          if (estudianteProgramaId) {
            // Actualizar existente
            await fetch(`${API_URL}/estudiante-programa/${estudianteProgramaId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(epPayload),
            })
          } else {
            // Crear nuevo
            await fetch(`${API_URL}/estudiante-programa`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(epPayload),
            })
          }
        } catch (err) {
          console.error("Error guardando programa:", err)
        }
      }
      
      const res = await fetch(`${API_URL}/prospectos/${prospectoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Error al actualizar datos")
      }
      
      // Recargar datos del prospecto para actualizar el estado
      const resProspecto = await fetch(`${API_URL}/prospectos/${prospectoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (resProspecto.ok) {
        const { data: prospectoActualizado } = await resProspecto.json()
        setProspectoData(prospectoActualizado)
        
        // Actualizar programa data si existe
        if (prospectoActualizado.programas && prospectoActualizado.programas.length > 0) {
          const programa = prospectoActualizado.programas[0]
          setProgramaData(programa)
        }
      }
      
      // Revalidar datos
      await validarDatosMinimos()
      
      await Swal.fire({
        icon: "success",
        title: "¡Datos guardados!",
        text: "Los datos faltantes han sido completados",
        timer: 2000,
        showConfirmButton: false,
      })
      
      // Avanzar al siguiente tab si ya no hay datos faltantes
      if (datosFaltantes.length === 0) {
        setActiveTab("boleta")
      }
      
    } catch (err: any) {
      console.error("Error:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudieron guardar los datos",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire("Error", "El archivo no debe superar los 5MB", "error")
      e.target.value = ""
      return
    }

    const validTypes = ["application/pdf", "image/jpeg", "image/png"]
    if (!validTypes.includes(file.type)) {
      Swal.fire("Error", "Solo se aceptan archivos PDF, JPG o PNG", "error")
      e.target.value = ""
      return
    }

    setArchivoRef(file)
    setBoletaData(prev => ({ ...prev, archivo: file }))

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
    
    e.target.value = ""
  }

  const handleRemoveFile = () => {
    setArchivoRef(null)
    setBoletaData(prev => ({ ...prev, archivo: null }))
    setPreviewUrl(null)
  }

  const subirBoleta = async () => {
    if (!boletaData.numeroBoleta.trim()) {
      Swal.fire("Error", "Ingrese el número de boleta", "error")
      return
    }
    if (!boletaData.banco) {
      Swal.fire("Error", "Seleccione el banco", "error")
      return
    }
    if (!boletaData.monto || parseFloat(boletaData.monto) <= 0) {
      Swal.fire("Error", "Ingrese un monto válido", "error")
      return
    }
    if (!boletaData.fechaRecibo) {
      Swal.fire("Error", "Seleccione la fecha del recibo", "error")
      return
    }
    if (!archivoRef) {
      Swal.fire("Error", "Debe adjuntar el comprobante de pago", "error")
      return
    }

    setIsUploading(true)

    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("prospecto_id", prospectoId)
      formData.append("tipo_documento", "inscripcion")
      formData.append("file", archivoRef)
      
      formData.append("metadata", JSON.stringify({
        numero_boleta: boletaData.numeroBoleta.trim(),
        banco: boletaData.banco,
        monto: boletaData.monto,
        fecha_recibo: boletaData.fechaRecibo,
        metodo_pago: "transferencia"
      }))

      await axios.post(`${API_URL}/documentos`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })

      setBoletaSubida(true)
      
      await Swal.fire({
        icon: "success",
        title: "Boleta guardada",
        html: `
          <p>El comprobante de pago fue guardado correctamente.</p>
        `,
        timer: 2000,
        showConfirmButton: false
      })
      
    } catch (error: any) {
      console.error("Error al subir boleta:", error)
      Swal.fire("Error", error.response?.data?.message || "Ocurrió un error al procesar la boleta", "error")
    } finally {
      setIsUploading(false)
    }
  }

  const crearAlerta = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")

      // 🔥 PASO 1: Guardar/actualizar todos los datos del prospecto antes de crear la alerta
      const payload: any = {}
      
      // Siempre actualizar estos campos si tienen valor
      if (formData.nombre_completo) {
        payload.nombreCompleto = formData.nombre_completo
      }
      if (formData.correo_electronico) {
        payload.correoElectronico = formData.correo_electronico
      }
      if (formData.numero_identificacion) {
        payload.numeroIdentificacion = formData.numero_identificacion
      }
      if (formData.telefono) {
        payload.telefono = formData.telefono
      }
      if (formData.modalidad) {
        payload.modalidad = formData.modalidad
      }
      if (formData.fecha_inicio_especifica) {
        payload.fechaInicioEspecifica = formData.fecha_inicio_especifica
      }

      // Actualizar prospecto
      if (Object.keys(payload).length > 0) {
        const resUpdate = await fetch(`${API_URL}/prospectos/${prospectoId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
        
        if (!resUpdate.ok) {
          const errorData = await resUpdate.json()
          throw new Error(errorData.message || "Error al actualizar datos del prospecto")
        }
      }

      // 🔥 PASO 2: Crear/actualizar estudiante_programa si hay programa y duración
      if (formData.programa_id && formData.duracion_meses) {
        try {
          // Obtener precios del programa
          const resPrecios = await fetch(`${API_URL}/precios/programa/${formData.programa_id}?meses=${formData.duracion_meses}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          
          let inscripcion = 0
          let cuotaMensual = 0
          
          if (resPrecios.ok) {
            const preciosData = await resPrecios.json()
            inscripcion = preciosData.inscripcion || 0
            cuotaMensual = preciosData.cuota_mensual || 0
          } else {
            // Si no hay precios, usar valores por defecto
            console.warn("No se pudieron obtener precios del programa, usando valores por defecto")
            inscripcion = 1000
            cuotaMensual = 1500
          }
          
          // Calcular fecha_fin e inversion_total
          const fechaInicio = formData.fecha_inicio_especifica || new Date().toISOString().split('T')[0]
          const fechaInicioObj = new Date(fechaInicio)
          const fechaFinObj = new Date(fechaInicioObj)
          fechaFinObj.setMonth(fechaFinObj.getMonth() + Number(formData.duracion_meses))
          const fechaFin = fechaFinObj.toISOString().split('T')[0]
          
          const inversionTotal = inscripcion + (cuotaMensual * Number(formData.duracion_meses))
          
          // Verificar si ya existe un estudiante_programa
          const resEP = await fetch(`${API_URL}/estudiante-programa?prospecto_id=${prospectoId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          
          let estudianteProgramaId = null
          if (resEP.ok) {
            const epData = await resEP.json()
            if (epData && epData.length > 0) {
              estudianteProgramaId = epData[0].id
            }
          }
          
          const epPayload: any = {
            programa_id: Number(formData.programa_id),
            duracion_meses: Number(formData.duracion_meses),
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            inscripcion: inscripcion,
            cuota_mensual: cuotaMensual,
            inversion_total: inversionTotal,
          }
          
          if (estudianteProgramaId) {
            // Actualizar existente
            const resUpdate = await fetch(`${API_URL}/estudiante-programa/${estudianteProgramaId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(epPayload),
            })
            
            if (!resUpdate.ok) {
              const errorData = await resUpdate.json()
              throw new Error(errorData.message || "Error al actualizar programa del estudiante")
            }
          } else {
            // Crear nuevo - usar el formato que espera el endpoint
            const resCreate = await fetch(`${API_URL}/estudiante-programa`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                prospecto_id: Number(prospectoId),
                programas: [epPayload],
              }),
            })
            
            if (!resCreate.ok) {
              const errorData = await resCreate.json()
              throw new Error(errorData.message || "Error al crear programa del estudiante")
            }
          }
        } catch (err: any) {
          console.error("Error guardando programa:", err)
          throw new Error(`Error al guardar programa académico: ${err.message}`)
        }
      }

      // 🔥 PASO 3: Crear la alerta
      const res = await fetch(`${API_URL}/alerta-alumno-nuevo/crear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prospecto_id: Number(prospectoId) }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Si aún faltan datos, mostrar mensaje específico
        if (data.tipo === "datos_faltantes") {
          throw new Error(`Faltan los siguientes datos: ${data.faltantes?.join(", ") || "datos requeridos"}`)
        }
        throw new Error(data.message || "Error al crear la alerta")
      }

      await Swal.fire({
        icon: "success",
        title: "¡Alerta generada!",
        html: `
          <p><strong>Alerta generada correctamente.</strong></p>
          <p>El prospecto fue enviado al flujo de alumno nuevo.</p>
          <p class="text-sm text-gray-600 mt-3">
            El asesor tiene <strong>10 días</strong> para completar este proceso.
          </p>
        `,
        timer: 3000,
        showConfirmButton: false,
      })

      if (onSuccess) {
        onSuccess()
      }
      onClose()

    } catch (err: any) {
      console.error("❌ Error:", err)
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo crear la alerta. Intenta nuevamente.",
      })
    } finally {
      setLoading(false)
    }
  }

  const puedeAvanzar = () => {
    if (activeTab === "validacion") {
      return datosFaltantes.length === 0 && tieneCarnet
    }
    if (activeTab === "datos") {
      // Verificar que todos los campos requeridos estén llenos
      const camposRequeridos = datosFaltantes.filter(f => 
        f === "Nombre completo" || f === "DPI" || f === "Correo electrónico"
      )
      return camposRequeridos.length === 0
    }
    if (activeTab === "boleta") {
      return boletaSubida || !archivoRef // Puede avanzar si ya subió o si no necesita subir
    }
    return true
  }

  if (loadingData) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={onClose} modal={true}>
      <DialogContent className="max-w-5xl max-h-[90vh] z-[9999]">
        <DialogHeader>
          <DialogTitle>Alerta Alumno Nuevo - {prospectoNombre}</DialogTitle>
          <DialogDescription>
            Completa el proceso paso a paso para enviar este prospecto al flujo de generación de credenciales.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="validacion">
              <AlertCircle className="h-4 w-4 mr-2" />
              Validación
            </TabsTrigger>
            <TabsTrigger value="datos">
              <FileText className="h-4 w-4 mr-2" />
              Completar Datos
            </TabsTrigger>
            <TabsTrigger value="boleta">
              <Upload className="h-4 w-4 mr-2" />
              Boleta
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: VALIDACIÓN */}
          <TabsContent value="validacion" className="space-y-4 mt-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Se validarán los datos mínimos requeridos para crear la alerta de alumno nuevo.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Datos Básicos Requeridos</h3>
                
                <div className="space-y-3">
                  {/* Nombre */}
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Nombre</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {prospectoData?.nombre_completo ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-600">{prospectoData.nombre_completo}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-600" />
                          <Badge variant="destructive" className="text-xs">Faltante</Badge>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Carnet */}
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Carnet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {tieneCarnet ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-600 font-mono">{carnetGenerado}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-600" />
                          <Badge variant="destructive" className="text-xs">Faltante</Badge>
                          <Button onClick={generarCarnet} variant="outline" size="sm" className="ml-2">
                            Generar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Correo */}
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Correo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {prospectoData?.correo_electronico ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-600">{prospectoData.correo_electronico}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-600" />
                          <Badge variant="destructive" className="text-xs">Faltante</Badge>
                        </>
                      )}
                    </div>
                  </div>

                  {/* DPI */}
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">DPI</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {prospectoData?.numero_identificacion ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-600">{prospectoData.numero_identificacion}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-600" />
                          <Badge variant="destructive" className="text-xs">Faltante</Badge>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Plan Académico */}
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Plan Académico</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {programaData?.programa?.nombre_del_programa ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-600">{programaData.programa.nombre_del_programa}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-600" />
                          <Badge variant="destructive" className="text-xs">Faltante</Badge>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Duración del Plan */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Duración del Plan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {programaData?.duracion_meses ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-600">{programaData.duracion_meses} meses</span>
                        </>
                      ) : programaData?.programa?.meses ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-600">{programaData.programa.meses} meses</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-600" />
                          <Badge variant="destructive" className="text-xs">Faltante</Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen de datos faltantes */}
              {datosFaltantes.length > 0 && (
                <Alert className="bg-red-50 border-red-200">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Datos básicos faltantes:</strong> {datosFaltantes.length} campo(s) requerido(s) deben ser completados antes de crear la alerta.
                  </AlertDescription>
                </Alert>
              )}

              {/* Mensaje cuando los datos básicos están completos */}
              {datosFaltantes.length === 0 && tieneCarnet && (
                <Alert className="bg-green-50 border-green-200 mt-6">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>¡Datos básicos completos!</strong> Puedes proceder a crear la alerta de alumno nuevo.
                    <br />
                    <span className="text-sm mt-2 block">
                      Nota: La ficha de inscripción completa se validará y completará después de crear la alerta.
                    </span>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (datosFaltantes.length > 0) {
                    setActiveTab("datos")
                  } else if (!tieneCarnet) {
                    Swal.fire({
                      icon: "warning",
                      title: "Carnet requerido",
                      text: "Debes generar el carnet antes de continuar",
                    })
                  } else {
                    setActiveTab("boleta")
                  }
                }}
                disabled={!puedeAvanzar()}
              >
                Siguiente
              </Button>
            </div>
          </TabsContent>

          {/* TAB 2: COMPLETAR DATOS */}
          <TabsContent value="datos" className="space-y-4 mt-4">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Completa los datos faltantes para continuar con el proceso.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {datosFaltantes.includes("Nombre completo") && (
                <div>
                  <Label>
                    Nombre completo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre_completo: e.target.value }))}
                    required
                  />
                </div>
              )}

              {/* DPI - Siempre visible y editable */}
              <div>
                <Label>
                  DPI / Número de Identificación <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.numero_identificacion}
                  onChange={(e) => {
                    const soloNumeros = e.target.value.replace(/[^0-9]/g, "")
                    setFormData(prev => ({ ...prev, numero_identificacion: soloNumeros }))
                  }}
                  required
                  placeholder="Solo números"
                  inputMode="numeric"
                />
              </div>

              {datosFaltantes.includes("Correo electrónico") && (
                <div>
                  <Label>
                    Correo electrónico <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={formData.correo_electronico}
                    onChange={(e) => setFormData(prev => ({ ...prev, correo_electronico: e.target.value }))}
                    required
                  />
                </div>
              )}

              {datosFaltantes.includes("Teléfono") && (
                <div>
                  <Label>
                    Teléfono <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    required
                  />
                </div>
              )}

              {datosFaltantes.includes("Modalidad") && (
                <div>
                  <Label>
                    Modalidad <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.modalidad}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, modalidad: v }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sincronica">Sincrónica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {datosFaltantes.includes("Fecha de inicio del programa") && (
                <div>
                  <Label>
                    Fecha de inicio del programa <span className="text-red-500">*</span>
                  </Label>
                  <SimpleDatePicker
                    value={formData.fecha_inicio_especifica}
                    onChange={(v) => setFormData(prev => ({ ...prev, fecha_inicio_especifica: v }))}
                  />
                </div>
              )}

              {/* Plan Académico - Siempre visible */}
              <div>
                <Label>
                  Plan Académico <span className="text-red-500">*</span>
                </Label>
                  <Select
                    value={formData.programa_id}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, programa_id: v }))}
                    disabled={loadingProgramas}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingProgramas ? "Cargando..." : "Seleccionar programa académico"} />
                    </SelectTrigger>
                    <SelectContent>
                      {programasAcademicos.length === 0 ? (
                        <SelectItem value="no-data" disabled>No hay programas disponibles</SelectItem>
                      ) : (
                        programasAcademicos.map((prog) => (
                          <SelectItem key={prog.id} value={prog.id.toString()}>
                            {prog.nombre_del_programa} {prog.abreviatura ? `(${prog.abreviatura})` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
              </div>

              {/* Duración del Plan - Siempre visible y editable */}
              <div>
                <Label>
                  Duración del Plan (meses) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.duracion_meses}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/[^0-9]/g, "")
                    setFormData(prev => ({ ...prev, duracion_meses: valor }))
                  }}
                  placeholder="Ej: 12"
                  inputMode="numeric"
                />
                {formData.programa_id && programasAcademicos.find(p => p.id.toString() === formData.programa_id)?.meses && (
                  <p className="text-xs text-blue-600 mt-1">
                    💡 Duración sugerida del programa seleccionado: {programasAcademicos.find(p => p.id.toString() === formData.programa_id)?.meses} meses (puedes editarla)
                  </p>
                )}
              </div>
            </div>

            {!tieneCarnet && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold mb-1">Generar Carnet</h4>
                    <p className="text-sm text-gray-600">El prospecto necesita un carnet para continuar</p>
                  </div>
                  <Button onClick={generarCarnet} variant="outline">
                    Generar Carnet
                  </Button>
                </div>
                {carnetGenerado && (
                  <div className="mt-2 text-green-600">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    Carnet generado: <strong>{carnetGenerado}</strong>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setActiveTab("validacion")}>
                Anterior
              </Button>
              <Button 
                onClick={guardarDatosFaltantes}
                disabled={loading || !puedeAvanzar()}
              >
                {loading ? "Guardando..." : "Guardar y Continuar"}
              </Button>
            </div>
          </TabsContent>

          {/* TAB 3: BOLETA */}
          <TabsContent value="boleta" className="space-y-4 mt-4">
            <Alert className="bg-blue-50 border-blue-200">
              <FileText className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Sube la boleta de inscripción con los datos mínimos requeridos.
              </AlertDescription>
            </Alert>

            {boletaSubida ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3 text-green-700">
                  <CheckCircle className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">Boleta de inscripción registrada</p>
                    <p className="text-sm">El comprobante fue guardado correctamente</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Número de Boleta/Referencia <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="Ej: 123456789"
                    value={boletaData.numeroBoleta}
                    onChange={(e) => setBoletaData(prev => ({ ...prev, numeroBoleta: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Banco <span className="text-red-500">*</span></Label>
                  <Select
                    value={boletaData.banco}
                    onValueChange={(v) => setBoletaData(prev => ({ ...prev, banco: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccione el banco" /></SelectTrigger>
                    <SelectContent>
                      {BANCOS.map((banco) => (
                        <SelectItem key={banco} value={banco}>{banco}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Monto (Q) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    min="0"
                    value={boletaData.monto || montoInscripcion.toString()}
                    onChange={(e) => setBoletaData(prev => ({ ...prev, monto: e.target.value }))}
                    placeholder={montoInscripcion.toString()}
                  />
                </div>

                <div>
                  <Label>Fecha del Recibo <span className="text-red-500">*</span></Label>
                  <SimpleDatePicker
                    value={boletaData.fechaRecibo}
                    onChange={(v) => setBoletaData(prev => ({ ...prev, fechaRecibo: v }))}
                  />
                </div>

                <div>
                  <Label>Comprobante de Pago <span className="text-red-500">*</span></Label>
                  {!boletaData.archivo ? (
                    <div
                      className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-400 cursor-pointer"
                      onClick={() => document.getElementById("comprobante-boleta")?.click()}
                    >
                      <Upload className="mx-auto h-16 w-16 text-blue-400" />
                      <p className="mt-2 text-sm text-gray-600">Arrastra un archivo o haz clic para seleccionar</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (máx. 5MB)</p>
                      <input
                        id="comprobante-boleta"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="font-medium text-sm">{boletaData.archivo.name}</p>
                            <p className="text-xs text-gray-500">{(boletaData.archivo.size / 1024).toFixed(2)} KB</p>
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
                    </div>
                  )}
                </div>

                <Button 
                  className="w-full" 
                  onClick={subirBoleta} 
                  disabled={isUploading || !archivoRef}
                >
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
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setActiveTab("datos")}>
                Anterior
              </Button>
              <Button 
                onClick={crearAlerta}
                disabled={loading || !boletaSubida}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "Creando alerta..." : "Crear Alerta"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <FilePreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          file={archivoRef}
          previewUrl={previewUrl}
        />
      </DialogContent>
    </Dialog>
  )
}
