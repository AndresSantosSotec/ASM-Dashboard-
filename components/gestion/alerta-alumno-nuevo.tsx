"use client"

import { useState, useEffect, useMemo } from "react"
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
    // 🆕 Nuevos campos para días de estudio y talleres
    dia_estudio: "", // String separado por comas para múltiples días
    fecha_taller_integracion: "",
    fecha_taller_reduccion: "", // Taller de inicio/reducción
    mes_inicio: "", // Mes de inicio (derivado de fecha_inicio_especifica o manual)
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
          const programas = Array.isArray(data) ? data : data.data || []
          // 🔥 Filtrar programas válidos (no null, no undefined)
          const programasValidos = programas.filter(p => p && p.id && p.nombre_del_programa)
          setProgramasAcademicos(programasValidos)
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
          // 🆕 Cargar días de estudio, talleres y mes de inicio
          dia_estudio: data.dia_estudio || "",
          fecha_taller_integracion: data.fecha_taller_integracion || "",
          fecha_taller_reduccion: data.fecha_taller_reduccion || "",
          mes_inicio: data.fecha_inicio_especifica
            ? new Date(data.fecha_inicio_especifica).toLocaleDateString('es-GT', { month: 'long', year: 'numeric' })
            : "",
        }))

        // 🆕 Cargar documentos del prospecto (especialmente boleta de inscripción)
        try {
          const resDocumentos = await fetch(`${API_URL}/documentos/prospecto/${prospectoId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (resDocumentos.ok) {
            const documentos = await resDocumentos.json()
            
            // Buscar documento de tipo "inscripcion"
            const boletaInscripcion = documentos.find((doc: any) => 
              doc.tipo_documento === "inscripcion" || doc.tipo_documento === "inscripción"
            )

            if (boletaInscripcion) {
              console.log("✅ Boleta de inscripción encontrada:", boletaInscripcion)
              
              // Parsear metadata si existe
              let metadata = null
              if (boletaInscripcion.metadata) {
                try {
                  metadata = typeof boletaInscripcion.metadata === 'string' 
                    ? JSON.parse(boletaInscripcion.metadata) 
                    : boletaInscripcion.metadata
                } catch (e) {
                  console.warn("⚠️ No se pudo parsear metadata:", e)
                }
              }

              // Cargar datos de la boleta en el estado
              if (metadata) {
                setBoletaData({
                  numeroBoleta: metadata.numero_boleta || "",
                  banco: metadata.banco || "",
                  monto: metadata.monto || (montoInscripcion > 0 ? montoInscripcion.toString() : ""),
                  fechaRecibo: metadata.fecha_recibo || "",
                  archivo: null, // El archivo ya está subido
                })
                setBoletaSubida(true) // Marcar como ya subida
                console.log("✅ Datos de boleta cargados desde documento existente")
              }
            } else {
              console.log("ℹ️ No se encontró boleta de inscripción existente")
            }
          }
        } catch (errDocs) {
          console.warn("⚠️ Error cargando documentos (no crítico):", errDocs)
          // No bloquear el flujo si falla la carga de documentos
        }

        // Validar datos mínimos después de cargar los datos
        await validarDatosMinimos()

        // 🆕 Si hay datos faltantes, cambiar automáticamente al tab de "Completar Datos"
        // Esto se hará después de que se establezcan los datosFaltantes
        setTimeout(() => {
          if (datosFaltantes.length > 0 || !data.correo_electronico || !data.numero_identificacion || !data.telefono) {
            // No cambiar automáticamente, solo mostrar el tab disponible
          }
        }, 100)

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
      const programaSeleccionado = programasAcademicos.find(p => p && p.id && p.id.toString() === formData.programa_id)
      if (programaSeleccionado?.meses) {
        setFormData(prev => ({
          ...prev,
          duracion_meses: programaSeleccionado.meses.toString(),
        }))
      }
    }
  }, [formData.programa_id, programasAcademicos])

  // Faltantes "efectivos": excluir los que ya están cubiertos por prospecto/programa o por el formulario (para que al llenar DPI u otros en el modal se reconozcan sin tener que guardar antes)
  const effectiveFaltantes = useMemo(() => {
    return datosFaltantes.filter((f) => {
      if (f === "Nombre completo") {
        return !(prospectoData?.nombre_completo?.trim() || formData.nombre_completo?.trim())
      }
      if (f === "Carnet") {
        return !tieneCarnet
      }
      if (f === "Correo electrónico") {
        return !(prospectoData?.correo_electronico?.trim() || formData.correo_electronico?.trim())
      }
      if (f === "DPI") {
        const dpiProspecto = prospectoData?.numero_identificacion?.trim()
        const dpiForm = formData.numero_identificacion?.trim()
        return !(dpiProspecto || (dpiForm && dpiForm.length >= 5))
      }
      if (f === "Teléfono") {
        return !(prospectoData?.telefono?.trim() || formData.telefono?.trim())
      }
      if (f === "Modalidad") {
        return !(prospectoData?.modalidad?.trim() || formData.modalidad?.trim())
      }
      if (f === "Fecha de inicio del programa") {
        return !(prospectoData?.fecha_inicio_especifica || formData.fecha_inicio_especifica?.trim())
      }
      if (f === "Plan Académico") {
        const tienePrograma = programaData?.programa?.nombre_del_programa || formData.programa_id
        return !tienePrograma
      }
      if (f === "Duración del Plan") {
        const duracion = programaData?.duracion_meses || programaData?.programa?.meses || formData.duracion_meses?.trim()
        return !(duracion && Number(duracion) > 0)
      }
      return true
    })
  }, [datosFaltantes, prospectoData, formData, programaData, tieneCarnet])

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

      // 🆕 Siempre establecer datosFaltantes si vienen en la respuesta
      // Esto asegura que los campos aparezcan si faltan datos
      if (data.faltantes && Array.isArray(data.faltantes)) {
        setDatosFaltantes(data.faltantes)
      } else if (res.ok && data.faltantes) {
        // Si la respuesta es OK pero tiene faltantes, establecerlos
        setDatosFaltantes(data.faltantes || [])
      } else {
        setDatosFaltantes([])
      }

      // Nota: Los datos de la ficha completa se validarán después, no aquí

      // Verificar carnet
      if (data.necesita_carnet) {
        setTieneCarnet(false)
      } else if (data.tiene_carnet) {
        setTieneCarnet(true)
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

      // 🆕 Guardar nuevos campos académicos
      if (formData.dia_estudio) {
        payload.diaEstudio = formData.dia_estudio
      }
      if (formData.fecha_taller_integracion) {
        payload.fechaTallerIntegracion = formData.fecha_taller_integracion
      }
      if (formData.fecha_taller_reduccion) {
        payload.fechaTallerReduccion = formData.fecha_taller_reduccion
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

    if (file.size > 100 * 1024 * 1024) {
      Swal.fire("Error", "El archivo no debe superar los 100MB", "error")
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

      // 🆕 Solo feedback visual, sin SweetAlert
      setBoletaSubida(true)

    } catch (error: any) {
      console.error("Error al subir boleta:", error)
      Swal.fire("Error", error.response?.data?.message || "Ocurrió un error al procesar la boleta", "error")
      setBoletaSubida(false) // Asegurar que se resetee el estado en caso de error
    } finally {
      setIsUploading(false)
    }
  }

  const crearAlerta = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      // 🔥 PASO 1: Guardar/actualizar todos los datos del prospecto antes de crear la alerta
      const payload: any = {}

      // Limpiar y validar datos antes de agregarlos al payload
      // Siempre actualizar estos campos si tienen valor válido
      if (formData.nombre_completo && formData.nombre_completo.trim()) {
        payload.nombreCompleto = formData.nombre_completo.trim()
      }
      if (formData.correo_electronico && formData.correo_electronico.trim()) {
        const email = formData.correo_electronico.trim()
        // Validar formato de email básico
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          payload.correoElectronico = email
        }
      }
      if (formData.numero_identificacion && formData.numero_identificacion.trim()) {
        payload.numeroIdentificacion = formData.numero_identificacion.trim()
      }
      if (formData.telefono && formData.telefono.trim()) {
        const telefono = formData.telefono.trim().replace(/\D/g, '') // Solo números
        if (telefono.length >= 8) {
          payload.telefono = telefono
        }
      }
      if (formData.modalidad && formData.modalidad.trim()) {
        payload.modalidad = formData.modalidad.trim()
      }
      if (formData.fecha_inicio_especifica && formData.fecha_inicio_especifica.trim()) {
        payload.fechaInicioEspecifica = formData.fecha_inicio_especifica.trim()
      }

      // 🆕 Guardar nuevos campos académicos en crearAlerta también
      if (formData.dia_estudio && formData.dia_estudio.trim()) {
        const diaEstudio = formData.dia_estudio.trim()
        // Limitar a 20 caracteres como máximo
        if (diaEstudio.length <= 20) {
          payload.diaEstudio = diaEstudio
        }
      }
      if (formData.fecha_taller_integracion && formData.fecha_taller_integracion.trim()) {
        payload.fechaTallerIntegracion = formData.fecha_taller_integracion.trim()
      }
      if (formData.fecha_taller_reduccion && formData.fecha_taller_reduccion.trim()) {
        payload.fechaTallerReduccion = formData.fecha_taller_reduccion.trim()
      }

      // Actualizar prospecto
      if (Object.keys(payload).length > 0) {
        try {
          // Validar datos antes de enviar
          if (payload.telefono && payload.telefono.length < 8) {
            throw new Error("El teléfono debe tener al menos 8 dígitos")
          }

          if (payload.correoElectronico && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.correoElectronico)) {
            throw new Error("El correo electrónico no tiene un formato válido")
          }

          if (payload.diaEstudio && payload.diaEstudio.length > 20) {
            throw new Error("El campo 'Días de Estudio' no puede exceder 20 caracteres")
          }

          const resUpdate = await fetch(`${API_URL}/prospectos/${prospectoId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          })

          if (!resUpdate.ok) {
            const errorData = await resUpdate.json().catch(() => ({ message: "Error desconocido" }))

            // Extraer mensajes de error específicos de validación
            let errorMessage = errorData.message || errorData.error || "Error al actualizar datos del prospecto"

            // Si hay errores de validación específicos, mostrarlos de forma más clara
            if (errorData.messages && typeof errorData.messages === 'object') {
              const validationErrors: string[] = []
              Object.entries(errorData.messages).forEach(([field, messages]) => {
                if (Array.isArray(messages)) {
                  messages.forEach((msg: string) => {
                    validationErrors.push(`${field}: ${msg}`)
                  })
                } else if (typeof messages === 'string') {
                  validationErrors.push(`${field}: ${messages}`)
                }
              })
              if (validationErrors.length > 0) {
                errorMessage = `Errores de validación:\n${validationErrors.join('\n')}`
              }
            } else if (errorData.errors && typeof errorData.errors === 'object') {
              const validationErrors: string[] = []
              Object.entries(errorData.errors).forEach(([field, messages]) => {
                if (Array.isArray(messages)) {
                  messages.forEach((msg: string) => {
                    validationErrors.push(`${field}: ${msg}`)
                  })
                } else if (typeof messages === 'string') {
                  validationErrors.push(`${field}: ${messages}`)
                }
              })
              if (validationErrors.length > 0) {
                errorMessage = `Errores de validación:\n${validationErrors.join('\n')}`
              }
            }

            console.error("Error actualizando prospecto:", errorData)
            console.error("Payload enviado:", payload)
            throw new Error(errorMessage)
          }

          // Recargar datos del prospecto después de actualizar
          const resProspecto = await fetch(`${API_URL}/prospectos/${prospectoId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (resProspecto.ok) {
            const { data: prospectoActualizado } = await resProspecto.json()
            setProspectoData(prospectoActualizado)
          }
        } catch (err: any) {
          console.error("Error en actualización de prospecto:", err)
          console.error("Payload que causó el error:", payload)
          throw new Error(`No se pudieron actualizar los datos del prospecto: ${err.message}`)
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
            if (epData && Array.isArray(epData) && epData.length > 0) {
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
              const errorData = await resUpdate.json().catch(() => ({ message: "Error desconocido" }))
              const errorMessage = errorData.message || errorData.error || "Error al actualizar programa del estudiante"
              console.error("Error actualizando estudiante_programa:", errorData)
              throw new Error(`Error al actualizar programa: ${errorMessage}`)
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
              const errorData = await resCreate.json().catch(() => ({ message: "Error desconocido" }))
              const errorMessage = errorData.message || errorData.error || "Error al crear programa del estudiante"
              console.error("Error creando estudiante_programa:", errorData)
              throw new Error(`Error al crear programa: ${errorMessage}`)
            }
          }
        } catch (err: any) {
          console.error("Error guardando programa:", err)
          throw new Error(`Error al guardar programa académico: ${err.message || "Error desconocido"}`)
        }
      }

      // 🔥 PASO 3: Crear la alerta
      try {
        const res = await fetch(`${API_URL}/alerta-alumno-nuevo/crear`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ prospecto_id: Number(prospectoId) }),
        })

        const data = await res.json().catch(() => ({ message: "Error al procesar respuesta del servidor" }))

        if (!res.ok) {
          // Si aún faltan datos, mostrar mensaje específico
          if (data.tipo === "datos_faltantes") {
            const faltantesList = Array.isArray(data.faltantes) ? data.faltantes.join(", ") : "datos requeridos"
            throw new Error(`Faltan los siguientes datos: ${faltantesList}`)
          }
          if (data.tipo === "necesita_carnet") {
            throw new Error("El prospecto necesita tener un carnet antes de crear la alerta")
          }
          if (data.tipo === "correo_duplicado") {
            throw new Error("El correo electrónico ya está registrado en otro estudiante")
          }
          const errorMessage = data.message || data.error || "Error al crear la alerta"
          console.error("Error creando alerta:", data)
          throw new Error(errorMessage)
        }
      } catch (err: any) {
        // Si el error ya tiene mensaje, re-lanzarlo
        if (err.message) {
          throw err
        }
        console.error("Error en creación de alerta:", err)
        throw new Error(`Error al crear la alerta: ${err.message || "Error desconocido"}`)
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

      // Extraer mensaje de error más específico
      let errorMessage = err.message || "No se pudo crear la alerta. Intenta nuevamente."

      // Si el error contiene información sobre validación, mostrarla
      if (errorMessage.includes("Validación fallida") || errorMessage.includes("validación")) {
        // Intentar obtener más detalles del error
        if (err.response?.data?.messages) {
          const validationErrors = Object.values(err.response.data.messages).flat()
          errorMessage = `Error de validación:\n${validationErrors.join('\n')}`
        } else if (err.response?.data?.errors) {
          const validationErrors = Object.values(err.response.data.errors).flat()
          errorMessage = `Error de validación:\n${validationErrors.join('\n')}`
        }
      }

      await Swal.fire({
        icon: "error",
        title: "Error al crear la alerta",
        html: `
          <div class="text-left">
            <p class="mb-2"><strong>No se pudo crear la alerta de alumno nuevo.</strong></p>
            <p class="text-sm text-gray-700">${errorMessage}</p>
            <p class="text-xs text-gray-500 mt-3">
              Por favor, verifica que todos los datos estén correctos y vuelve a intentar.
            </p>
          </div>
        `,
        width: "500px",
      })
    } finally {
      setLoading(false)
    }
  }

  const puedeAvanzar = () => {
    if (activeTab === "validacion") {
      return effectiveFaltantes.length === 0 && tieneCarnet
    }
    if (activeTab === "datos") {
      const camposRequeridos = effectiveFaltantes.filter(f =>
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
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col z-[9999]">
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

                  {/* DPI - considerar también el valor del formulario (Completar Datos) para que se reconozca al llenar */}
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">DPI</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(prospectoData?.numero_identificacion?.trim() || (formData.numero_identificacion?.trim() && formData.numero_identificacion.trim().length >= 5)) ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-600">
                            {prospectoData?.numero_identificacion?.trim() || formData.numero_identificacion}
                          </span>
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
              {effectiveFaltantes.length > 0 && (
                <Alert className="bg-red-50 border-red-200">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Datos básicos faltantes:</strong> {effectiveFaltantes.length} campo(s) requerido(s) deben ser completados antes de crear la alerta.
                  </AlertDescription>
                </Alert>
              )}

              {/* Mensaje cuando los datos básicos están completos */}
              {effectiveFaltantes.length === 0 && tieneCarnet && (
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
          <TabsContent value="datos" className="space-y-4 mt-4 max-h-[calc(90vh-250px)] overflow-y-auto">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 text-sm">
                Completa los datos faltantes para continuar con el proceso. Todos los campos marcados con * son obligatorios.
              </AlertDescription>
            </Alert>

            {/* Sección: Datos Personales Básicos */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Datos Personales Básicos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre completo - Siempre visible si falta */}
                {(datosFaltantes.includes("Nombre completo") || !prospectoData?.nombre_completo) && (
                  <div>
                    <Label>
                      Nombre completo <span className="text-red-500">*</span>
                      {datosFaltantes.includes("Nombre completo") && (
                        <Badge variant="destructive" className="ml-2 text-xs">Faltante</Badge>
                      )}
                    </Label>
                    <Input
                      value={formData.nombre_completo}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre_completo: e.target.value }))}
                      required
                      placeholder="Nombre completo del prospecto"
                      className={datosFaltantes.includes("Nombre completo") ? "border-red-500" : ""}
                    />
                  </div>
                )}

                {/* DPI - Siempre visible y editable */}
                <div>
                  <Label>
                    DPI / Número de Identificación <span className="text-red-500">*</span>
                    {datosFaltantes.includes("DPI") && (
                      <Badge variant="destructive" className="ml-2 text-xs">Faltante</Badge>
                    )}
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
                    className={datosFaltantes.includes("DPI") ? "border-red-500" : ""}
                  />
                </div>

                {/* Correo electrónico - Siempre visible si falta */}
                {(datosFaltantes.includes("Correo electrónico") || !prospectoData?.correo_electronico) && (
                  <div>
                    <Label>
                      Correo electrónico <span className="text-red-500">*</span>
                      {datosFaltantes.includes("Correo electrónico") && (
                        <Badge variant="destructive" className="ml-2 text-xs">Faltante</Badge>
                      )}
                    </Label>
                    <Input
                      type="email"
                      value={formData.correo_electronico}
                      onChange={(e) => setFormData(prev => ({ ...prev, correo_electronico: e.target.value }))}
                      required
                      placeholder="ejemplo@correo.com"
                      className={datosFaltantes.includes("Correo electrónico") ? "border-red-500" : ""}
                    />
                  </div>
                )}

                {/* Teléfono - Siempre visible si falta */}
                {(datosFaltantes.includes("Teléfono") || !prospectoData?.telefono) && (
                  <div>
                    <Label>
                      Teléfono <span className="text-red-500">*</span>
                      {datosFaltantes.includes("Teléfono") && (
                        <Badge variant="destructive" className="ml-2 text-xs">Faltante</Badge>
                      )}
                    </Label>
                    <Input
                      value={formData.telefono}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                      required
                      placeholder="Ej: 12345678"
                      className={datosFaltantes.includes("Teléfono") ? "border-red-500" : ""}
                    />
                  </div>
                )}

                {/* Modalidad - Siempre visible si falta */}
                {(datosFaltantes.includes("Modalidad") || !prospectoData?.modalidad) && (
                  <div>
                    <Label>
                      Modalidad <span className="text-red-500">*</span>
                      {datosFaltantes.includes("Modalidad") && (
                        <Badge variant="destructive" className="ml-2 text-xs">Faltante</Badge>
                      )}
                    </Label>
                    <Select
                      value={formData.modalidad}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, modalidad: v }))}
                      required
                    >
                      <SelectTrigger className={datosFaltantes.includes("Modalidad") ? "border-red-500" : ""}>
                        <SelectValue placeholder="Seleccionar modalidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sincronica">Sincrónica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Fecha de inicio - Siempre visible si falta */}
                {(datosFaltantes.includes("Fecha de inicio del programa") || !prospectoData?.fecha_inicio_especifica) && (
                  <div>
                    <Label>
                      Fecha de inicio del programa <span className="text-red-500">*</span>
                      {datosFaltantes.includes("Fecha de inicio del programa") && (
                        <Badge variant="destructive" className="ml-2 text-xs">Faltante</Badge>
                      )}
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
                        programasAcademicos
                          .filter(prog => prog && prog.id && prog.nombre_del_programa)
                          .map((prog) => (
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
                  {formData.programa_id && programasAcademicos.find(p => p && p.id && p.id.toString() === formData.programa_id)?.meses && (
                    <p className="text-xs text-blue-600 mt-1">
                      💡 Duración sugerida del programa seleccionado: {programasAcademicos.find(p => p && p.id && p.id.toString() === formData.programa_id)?.meses} meses (puedes editarla)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 🆕 Sección: Datos Académicos Adicionales */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Datos Académicos y Talleres</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fecha de inicio específica - Siempre visible */}
                <div>
                  <Label>
                    Fecha de inicio específica <span className="text-red-500">*</span>
                  </Label>
                  <SimpleDatePicker
                    value={formData.fecha_inicio_especifica}
                    onChange={(v) => {
                      setFormData(prev => ({ ...prev, fecha_inicio_especifica: v }))
                      // 🆕 Actualizar mes de inicio automáticamente
                      if (v) {
                        const fecha = new Date(v)
                        const mesTexto = fecha.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' })
                        setFormData(prev => ({ ...prev, mes_inicio: mesTexto }))
                      }
                    }}
                  />
                </div>

                {/* Mes de inicio - Mostrado automáticamente */}
                <div>
                  <Label>
                    Mes de inicio
                  </Label>
                  <Input
                    value={formData.mes_inicio || (formData.fecha_inicio_especifica
                      ? new Date(formData.fecha_inicio_especifica).toLocaleDateString('es-GT', { month: 'long', year: 'numeric' })
                      : "")}
                    readOnly
                    className="bg-gray-50 text-gray-700"
                    placeholder="Se calculará automáticamente"
                  />
                  <p className="text-xs text-gray-500 mt-1">Se calcula automáticamente según la fecha de inicio</p>
                </div>

                {/* 🆕 Taller de integración */}
                <div>
                  <Label>
                    Fecha taller de integración <span className="text-red-500">*</span>
                  </Label>
                  <SimpleDatePicker
                    value={formData.fecha_taller_integracion}
                    onChange={(v) => setFormData(prev => ({ ...prev, fecha_taller_integracion: v }))}
                    placeholder="Seleccionar fecha del taller"
                  />
                </div>

                {/* 🆕 Taller de inicio/reducción */}
                <div>
                  <Label>
                    Fecha taller de inicio/reducción <span className="text-red-500">*</span>
                  </Label>
                  <SimpleDatePicker
                    value={formData.fecha_taller_reduccion}
                    onChange={(v) => setFormData(prev => ({ ...prev, fecha_taller_reduccion: v }))}
                    placeholder="Seleccionar fecha del taller"
                  />
                </div>
              </div>

              {/* 🆕 Selección múltiple de días de estudio */}
              <div className="space-y-2">
                <Label>
                  Días que estudiará <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border p-3 rounded-md bg-gray-50">
                  {["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"].map((dia) => {
                    const seleccionados = formData.dia_estudio ? formData.dia_estudio.split(", ").map(d => d.trim().toLowerCase()) : []
                    const activo = seleccionados.includes(dia.toLowerCase())

                    return (
                      <button
                        type="button"
                        key={dia}
                        onClick={() => {
                          let nuevosSeleccionados = [...seleccionados]
                          if (activo) {
                            nuevosSeleccionados = nuevosSeleccionados.filter(d => d !== dia.toLowerCase())
                          } else {
                            nuevosSeleccionados.push(dia.toLowerCase())
                          }
                          setFormData(prev => ({
                            ...prev,
                            dia_estudio: nuevosSeleccionados.join(", ")
                          }))
                        }}
                        className={`text-sm p-2 rounded border transition-colors ${activo
                            ? "bg-blue-600 text-white border-blue-700 font-semibold"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                          }`}
                      >
                        {dia.charAt(0).toUpperCase() + dia.slice(1)}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-600">
                  Seleccionados: <strong>{formData.dia_estudio || "Ninguno"}</strong>
                </p>
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
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-3 text-green-700">
                  <CheckCircle className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">Boleta de inscripción registrada</p>
                    <p className="text-sm">El comprobante fue guardado correctamente</p>
                  </div>
                </div>
                
                {/* Mostrar datos de la boleta cargada */}
                <div className="mt-4 grid grid-cols-2 gap-4 bg-white rounded-lg p-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Número de Boleta</p>
                    <p className="text-sm font-semibold text-gray-800">{boletaData.numeroBoleta || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Banco</p>
                    <p className="text-sm font-semibold text-gray-800">{boletaData.banco || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Monto</p>
                    <p className="text-sm font-semibold text-gray-800">Q {boletaData.monto || montoInscripcion}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Fecha del Recibo</p>
                    <p className="text-sm font-semibold text-gray-800">{boletaData.fechaRecibo || "N/A"}</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBoletaSubida(false)}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Modificar boleta
                  </Button>
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
