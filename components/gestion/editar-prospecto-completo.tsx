"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { X, CheckCircle, Upload, FileText, Eye, XCircle, Loader2, Trash2, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SimpleDatePicker } from "@/components/ui/simple-date-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ServerFilePreviewModal } from "@/components/ui/server-file-preview-modal"
import Swal from "sweetalert2"
import { API_BASE_URL } from "@/utils/apiConfig"
import fetchFicha from "@/services/fichas"
import type { DatosAcademicos, DatosFinancieros, DatosLaborales } from "@/components/inscripcion/types"
import axios from "axios"

interface ProspectoCompleto {
  id: string
  nombre_completo: string
  telefono: string | null
  correo_electronico: string | null
  genero: string
  numero_identificacion: string | null
  empresa_donde_labora_actualmente: string | null
  puesto: string | null
  notas_generales: string | null
  observaciones: string | null
  interes: string | null
  status: string
  medio_conocimiento_institucion: string | null
  pais_nombre: string | null
  departamento_nombre: string | null
  municipio_nombre: string | null
}

interface EditarProspectoCompletoProps {
  prospectoId: string
  onClose: () => void
  onUpdate?: () => void
}

const API_URL = `${API_BASE_URL}/api`

export default function EditarProspectoCompleto({ prospectoId, onClose, onUpdate }: EditarProspectoCompletoProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [programas, setProgramas] = useState<any[]>([])
  const [convenios, setConvenios] = useState<any[]>([])
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [documentos, setDocumentos] = useState<any[]>([])
  const [tieneFicha, setTieneFicha] = useState(false)
  const [estudiantePrograma, setEstudiantePrograma] = useState<any>(null)
  const [cuotasEstudiante, setCuotasEstudiante] = useState<any[]>([])
  const [programasInscritos, setProgramasInscritos] = useState<any[]>([])
  const [calculandoPrecios, setCalculandoPrecios] = useState(false)
  
  // Cache para precios
  const precioCache = useRef(new Map<string, { inscripcion: number; cuota_mensual: number }>())
  const lastPrecioKey = useRef("")
  
  // Estados del formulario básico
  const [formData, setFormData] = useState<ProspectoCompleto>({
    id: "",
    nombre_completo: "",
    telefono: "",
    correo_electronico: "",
    genero: "",
    numero_identificacion: "",
    empresa_donde_labora_actualmente: "",
    puesto: "",
    notas_generales: "",
    observaciones: "",
    interes: "",
    status: "",
    medio_conocimiento_institucion: "",
    pais_nombre: "",
    departamento_nombre: "",
    municipio_nombre: "",
  })

  // Estados de datos de ficha
  const [datosAcademicos, setDatosAcademicos] = useState<Partial<DatosAcademicos>>({})
  const [datosFinancieros, setDatosFinancieros] = useState<Partial<DatosFinancieros>>({
    tieneConvenio: false,
  })
  const [datosLaborales, setDatosLaborales] = useState<Partial<DatosLaborales>>({})

  // Cargar datos del prospecto y ficha
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        
        // Helper: convertir ISO timestamp a "YYYY-MM-DD" para SimpleDatePicker
        const toDateStr = (v: string | null | undefined): string => {
          if (!v) return ""
          // Si ya es YYYY-MM-DD, devolverlo tal cual
          if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
          // Si es ISO timestamp "2026-03-01T00:00:00.000000Z", extraer solo la fecha
          const match = v.match(/^(\d{4}-\d{2}-\d{2})/)
          return match ? match[1] : v
        }
        
        // Cargar prospecto (incluye programas.programa eager-loaded)
        const resProspecto = await fetch(`${API_URL}/prospectos/${prospectoId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        
        if (!resProspecto.ok) throw new Error("Error al cargar prospecto")
        
        const { data } = await resProspecto.json()

        // Normalizar género: DB puede almacenar "masculino" pero Select espera "Masculino"
        const normalizeGenero = (g: string | null | undefined): string => {
          if (!g) return ""
          const lower = g.toLowerCase().trim()
          const map: Record<string, string> = { masculino: "Masculino", femenino: "Femenino", otro: "Otro" }
          return map[lower] || g
        }

        // Normalizar status: asegurar que coincida con las opciones del Select
        const normalizeStatus = (s: string | null | undefined): string => {
          if (!s) return ""
          const opciones = ["No contactado", "En seguimiento", "Le interesa a futuro", "Perdido", "Inscrito", "Activo", "Promesa de pago"]
          const found = opciones.find(o => o.toLowerCase() === s.toLowerCase().trim())
          return found || s
        }
        
        setFormData({
          id: data.id,
          nombre_completo: data.nombre_completo || "",
          telefono: data.telefono || "",
          correo_electronico: data.correo_electronico || "",
          genero: normalizeGenero(data.genero),
          numero_identificacion: data.numero_identificacion || "",
          empresa_donde_labora_actualmente: data.empresa_donde_labora_actualmente || "",
          puesto: data.puesto || "",
          notas_generales: data.notas_generales || "",
          observaciones: data.observaciones || "",
          interes: data.interes || "",
          status: normalizeStatus(data.status),
          medio_conocimiento_institucion: data.medio_conocimiento_institucion || "",
          pais_nombre: data.pais_nombre || "",
          departamento_nombre: data.departamento_nombre || "",
          municipio_nombre: data.municipio_nombre || "",
        })

        // Usar programas inscritos directamente del prospecto (eager-loaded)
        const prospectoPrograms = Array.isArray(data.programas) ? data.programas : []
        if (prospectoPrograms.length > 0) {
          setProgramasInscritos(prospectoPrograms)
          
          const epMasReciente = [...prospectoPrograms].sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
          setEstudiantePrograma(epMasReciente)
          
          // Cargar cuotas del programa más reciente
          try {
            const resCuotas = await fetch(`${API_URL}/cuotas/estudiante-programa/${epMasReciente.id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            })
            if (resCuotas.ok) {
              const cuotasData = await resCuotas.json()
              setCuotasEstudiante(Array.isArray(cuotasData) ? cuotasData : [])
            }
          } catch (err) {
            console.warn("No se pudo cargar cuotas:", err)
          }
        }

        // Intentar cargar ficha de inscripción
        let fichaLoaded = false
        try {
          const fichaData = await fetchFicha(Number(prospectoId))
          fichaLoaded = true
          setTieneFicha(true)
          
          // Cargar datos académicos — merge con programa/duracion del programa inscrito
          const academicosBase: Partial<DatosAcademicos> = {}
          if (fichaData.academicos) {
            Object.assign(academicosBase, fichaData.academicos)
            // Convertir fechas a formato YYYY-MM-DD para SimpleDatePicker
            if (academicosBase.fechaInicioEspecifica) {
              academicosBase.fechaInicioEspecifica = toDateStr(academicosBase.fechaInicioEspecifica as string)
            }
            if (academicosBase.fechaTallerInduccion) {
              academicosBase.fechaTallerInduccion = toDateStr(academicosBase.fechaTallerInduccion as string)
            }
            if (academicosBase.fechaTallerIntegracion) {
              academicosBase.fechaTallerIntegracion = toDateStr(academicosBase.fechaTallerIntegracion as string)
            }
          }
          
          // Poblar programa y duracion desde el programa inscrito más reciente
          if (prospectoPrograms.length > 0) {
            const ep0 = prospectoPrograms[0]
            if (ep0.programa_id && !academicosBase.programa) {
              academicosBase.programa = ep0.programa_id.toString()
            }
            if (ep0.duracion_meses && !academicosBase.duracion) {
              academicosBase.duracion = ep0.duracion_meses.toString()
            }
          }
          
          setDatosAcademicos(academicosBase)
          
          // Cargar datos financieros — asegurar tieneConvenio
          if (fichaData.financieros) {
            const fin = { ...fichaData.financieros }
            // Derivar tieneConvenio de convenioId
            if (fin.convenioId && !fin.tieneConvenio) {
              fin.tieneConvenio = true
            }
            setDatosFinancieros(fin)
          }
          
          // Cargar datos laborales
          if (fichaData.laborales) {
            setDatosLaborales(fichaData.laborales)
          }
          
          // Cargar documentos de la ficha
          if (fichaData.documentos) {
            setDocumentos(fichaData.documentos)
          }
        } catch {
          // No tiene ficha — cargar datos directamente del prospecto
          fichaLoaded = false
          setTieneFicha(false)
          
          // Aún así poblar académicos y financieros del prospecto directo
          const academicosFromProspecto: Partial<DatosAcademicos> = {
            modalidad: data.modalidad || undefined,
            fechaInicioEspecifica: toDateStr(data.fecha_inicio_especifica),
            fechaTallerInduccion: toDateStr(data.fecha_taller_reduccion),
            fechaTallerIntegracion: toDateStr(data.fecha_taller_integracion),
            ultimoTitulo: data.ultimo_titulo_obtenido || undefined,
            institucionAnterior: data.institucion_titulo || undefined,
            añoGraduacion: data.anio_graduacion || undefined,
            cursosAprobados: data.cantidad_cursos_aprobados || undefined,
            diaEstudio: data.dia_estudio || undefined,
            medioConocio: data.medio_conocimiento_institucion || undefined,
          }
          
          // Poblar programa y duracion desde programa inscrito
          if (prospectoPrograms.length > 0) {
            const ep0 = prospectoPrograms[0]
            if (ep0.programa_id) academicosFromProspecto.programa = ep0.programa_id.toString()
            if (ep0.duracion_meses) academicosFromProspecto.duracion = ep0.duracion_meses.toString()
          }
          
          setDatosAcademicos(academicosFromProspecto)
          
          // Financieros del prospecto
          const finFromProspecto: Partial<DatosFinancieros> = {
            formaPago: data.metodo_pago || undefined,
            convenioId: data.convenio_pago_id || undefined,
            tieneConvenio: !!data.convenio_pago_id,
          }
          if (prospectoPrograms.length > 0) {
            const ep0 = prospectoPrograms[0]
            if (ep0.inscripcion) finFromProspecto.inscripcion = ep0.inscripcion
            if (ep0.cuota_mensual) finFromProspecto.cuotaMensual = ep0.cuota_mensual
            if (ep0.inversion_total) finFromProspecto.inversionTotal = ep0.inversion_total
          }
          setDatosFinancieros(finFromProspecto)
          
          // Laborales del prospecto
          setDatosLaborales({
            empresa: data.empresa_donde_labora_actualmente || undefined,
            puesto: data.puesto || undefined,
            telefonoCorporativo: data.telefono_corporativo || undefined,
            direccionEmpresa: data.direccion_empresa || undefined,
            sectorEmpresa: data.sector_empresa || undefined,
          })
        }
        
        // Cargar programas catálogo
        const resProgramas = await fetch(`${API_URL}/programas`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        
        if (resProgramas.ok) {
          const programasData = await resProgramas.json()
          setProgramas(programasData)
        }

        // Cargar convenios
        const resConvenios = await fetch(`${API_URL}/convenios`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        
        if (resConvenios.ok) {
          const conveniosData = await resConvenios.json()
          setConvenios(conveniosData)
        }

        // Cargar departamentos
        const resDeptos = await fetch(`${API_URL}/ubicacion/1`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        
        if (resDeptos.ok) {
          const deptosData = await resDeptos.json()
          setDepartamentos(deptosData.departamentos || [])
        }

        // Cargar documentos (más recientes por tipo)
        const resDocs = await fetch(`${API_URL}/documentos/prospecto/${prospectoId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        
        if (resDocs.ok) {
          const docsData = await resDocs.json()
          // Agrupar por tipo y tomar el más reciente de cada uno
          const docsPorTipo = new Map<string, any>()
          if (Array.isArray(docsData)) {
            docsData.forEach((doc: any) => {
              const tipo = doc.tipo_documento || "otros"
              const existing = docsPorTipo.get(tipo)
              if (!existing || new Date(doc.created_at) > new Date(existing.created_at)) {
                docsPorTipo.set(tipo, doc)
              }
            })
          }
          setDocumentos(Array.from(docsPorTipo.values()))
        }
        
      } catch (err: any) {
        console.error("❌ Error cargando datos:", err)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los datos del prospecto",
        })
      } finally {
        setLoadingData(false)
      }
    }
    
    fetchData()
  }, [prospectoId])

  const handleChange = (field: keyof ProspectoCompleto, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Eliminar programa inscrito con cascada
  const handleEliminarProgramaInscrito = async (ep: any, nombreProg: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar programa?",
      html: `
        <p>Estás a punto de eliminar:</p>
        <p class="font-bold text-lg mt-2">${nombreProg}</p>
        <p class="text-sm text-gray-500 mt-2">Se eliminarán también todas las cuotas y pagos asociados a este programa.</p>
        <p class="text-sm text-red-600 mt-1 font-semibold">Esta acción no se puede deshacer.</p>
      `,
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    })

    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/estudiante-programa/${ep.id}/cascade`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || `Error HTTP ${res.status}`)
      }

      const data = await res.json()

      // Actualizar lista local
      setProgramasInscritos(prev => prev.filter((p: any) => p.id !== ep.id))

      Swal.fire({
        icon: "success",
        title: "Programa eliminado",
        html: `<p>${nombreProg} fue eliminado.</p>
               <p class="text-xs text-gray-500 mt-1">${data.cuotas_eliminadas || 0} cuotas y ${data.pagos_eliminados || 0} pagos eliminados.</p>`,
        timer: 3000,
        showConfirmButton: false,
      })
    } catch (err: any) {
      console.error("Error al eliminar programa:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo eliminar el programa",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      
      const payload = {
        nombreCompleto: formData.nombre_completo,
        telefono: formData.telefono || null,
        correoElectronico: formData.correo_electronico || null,
        genero: formData.genero,
        dpi: formData.numero_identificacion || null,
        empresaDondeLaboraActualmente: formData.empresa_donde_labora_actualmente || null,
        puesto: formData.puesto || null,
        notasGenerales: formData.notas_generales || null,
        observaciones: formData.observaciones || null,
        interes: formData.interes || null,
        status: formData.status,
        medio_conocimiento_institucion: formData.medio_conocimiento_institucion || null,
        // Datos académicos
        modalidad: datosAcademicos.modalidad || null,
        fechaInicioEspecifica: datosAcademicos.fechaInicioEspecifica || null,
        fechaTallerReduccion: datosAcademicos.fechaTallerInduccion || null,
        fechaTallerIntegracion: datosAcademicos.fechaTallerIntegracion || null,
        ultimoTituloObtenido: datosAcademicos.ultimoTitulo || null,
        institucionTitulo: datosAcademicos.institucionAnterior || null,
        anioGraduacion: datosAcademicos.añoGraduacion || null,
        cantidadCursosAprobados: datosAcademicos.cursosAprobados || null,
        diaEstudio: datosAcademicos.diaEstudio || null,
        // Datos financieros del prospecto (solo método de pago y convenio van a prospectos)
        metodoPago: datosFinancieros.formaPago || null,
        convenioId: datosFinancieros.convenioId || null,
        // Datos laborales
        telefonoCorporativo: datosLaborales.telefonoCorporativo || null,
        direccionEmpresa: datosLaborales.direccionEmpresa || null,
        sectorEmpresa: datosLaborales.sectorEmpresa || null,
      }
      
      const res = await fetch(`${API_URL}/prospectos/${prospectoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      
      const body = await res.json()
      
      if (!res.ok) {
        const errorMsg = body.messages?.correoElectronico?.[0] || body.message || `Error ${res.status}`
        throw new Error(errorMsg)
      }

      // 🆕 Actualizar datos financieros en estudiante_programa si existe
      if (estudiantePrograma && datosAcademicos.programa) {
        try {
          // Calcular fecha_fin basada en fecha_inicio + duracion_meses
          const fechaInicio = datosAcademicos.fechaInicio || new Date().toISOString().split('T')[0]
          const duracionMeses = parseInt(datosFinancieros.cantidadMeses || datosAcademicos.duracion || "12")
          const fechaFin = new Date(fechaInicio)
          fechaFin.setMonth(fechaFin.getMonth() + duracionMeses)
          
          const payloadFinanciero = {
            programa_id: parseInt(datosAcademicos.programa),
            duracion_meses: duracionMeses,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin.toISOString().split('T')[0],
            inscripcion: parseFloat(datosFinancieros.inscripcion || "0"),
            cuota_mensual: parseFloat(datosFinancieros.cuotaMensual || "0"),
            inversion_total: parseFloat(datosFinancieros.inversionTotal || "0"),
            convenio_id: datosFinancieros.convenioId || null,
          }

          const resFinanciero = await fetch(`${API_URL}/estudiante-programa/${estudiantePrograma.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payloadFinanciero),
          })

          if (!resFinanciero.ok) {
            const errorData = await resFinanciero.json()
            console.warn("⚠️ Error actualizando datos financieros:", errorData)
            // No lanzar error, solo alertar que los datos del prospecto se guardaron pero no los financieros
            await Swal.fire({
              icon: "warning",
              title: "Actualización parcial",
              text: "Los datos del prospecto se guardaron, pero hubo un error al actualizar los datos financieros. Verifique e intente nuevamente.",
            })
          } else {
            console.log("✅ Datos financieros actualizados correctamente")
          }
        } catch (errFinanciero: any) {
          console.error("❌ Error actualizando datos financieros:", errFinanciero)
          // No bloquear la actualización del prospecto
        }
      }
      
      // Invalidar cachés
      localStorage.removeItem("gestion_prospectos_cache")
      localStorage.removeItem("gestion_prospectos_cache_time")
      localStorage.removeItem("seguimiento_prospectos_cache")
      localStorage.removeItem("seguimiento_prospectos_cache_time")

      // 🔄 Disparar evento para invalidar caché en otros componentes
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("prospecto:updated"))
      }
      
      onClose()
      
      if (onUpdate) {
        onUpdate()
      }

      // Esperar a que React desmonte el Dialog (evita que el focus-trap bloquee el SweetAlert)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      await Swal.fire({
        icon: "success",
        title: "¡Actualizado!",
        text: "El prospecto ha sido actualizado exitosamente",
        timer: 2000,
        showConfirmButton: false
      })
      
    } catch (err: any) {
      console.error("❌ Error actualizando:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo actualizar el prospecto",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (tipoDocumento: string, file: File) => {
    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("prospecto_id", prospectoId)
      formData.append("tipo_documento", tipoDocumento)
      formData.append("file", file)

      await axios.post(`${API_URL}/documentos`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })

      // Recargar documentos
      const resDocs = await fetch(`${API_URL}/documentos/prospecto/${prospectoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (resDocs.ok) {
        const docsData = await resDocs.json()
        setDocumentos(Array.isArray(docsData) ? docsData : [])
      }

      await Swal.fire({
        icon: "success",
        title: "Documento subido",
        text: "El documento se ha subido correctamente",
        timer: 2000,
        showConfirmButton: false
      })
    } catch (err: any) {
      console.error("Error subiendo documento:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo subir el documento",
      })
    }
  }

  const getDocUrl = (doc: any) => {
    if (doc.ruta_archivo) {
      return `${API_BASE_URL}/storage/${doc.ruta_archivo}`
    }
    return `${API_URL}/documentos/${doc.id}/file`
  }

  const hasField = (value: any) => value !== null && value !== undefined && value !== ""

  // Programas únicos (sin duplicados)
  const programasUnicos = useMemo(() => {
    const map = new Map<string, any>()
    programas.forEach((p) => {
      const key = `${p.abreviatura}-${p.nombre_del_programa}`
      if (!map.has(key)) map.set(key, p)
    })
    return Array.from(map.values())
  }, [programas])

  // Calcular precios cuando cambia el programa académico
  useEffect(() => {
    if (!datosAcademicos.programa || !datosAcademicos.duracion) {
      return
    }

    const programaId = datosAcademicos.programa
    const duracion = parseInt(datosAcademicos.duracion) || 0
    const convId = datosFinancieros.tieneConvenio ? datosFinancieros.convenioId : null

    const key = `${convId ?? "no"}-${programaId}-${duracion}`
    if (key === lastPrecioKey.current) return
    lastPrecioKey.current = key

    if (precioCache.current.has(key)) {
      const cached = precioCache.current.get(key)!
      setDatosFinancieros(prev => ({
        ...prev,
        inscripcion: cached.inscripcion.toFixed(2),
        cuotaMensual: cached.cuota_mensual.toFixed(2),
        cantidadMeses: duracion.toString(),
        inversionTotal: (cached.inscripcion + cached.cuota_mensual * duracion).toFixed(2),
      }))
      return
    }

    setCalculandoPrecios(true)
    const url = convId
      ? `${API_URL}/precios/convenio/${convId}/${programaId}?meses=${duracion}`
      : `${API_URL}/precios/programa/${programaId}?meses=${duracion}`

    axios.get<{ inscripcion: number; cuota_mensual: number }>(url)
      .then((r) => {
        precioCache.current.set(key, r.data)
        const insc = r.data.inscripcion.toFixed(2)
        const cuota = r.data.cuota_mensual.toFixed(2)
        const total = (r.data.inscripcion + r.data.cuota_mensual * duracion).toFixed(2)
        setDatosFinancieros(prev => ({
          ...prev,
          inscripcion: insc,
          cuotaMensual: cuota,
          cantidadMeses: duracion.toString(),
          inversionTotal: total,
        }))
      })
      .catch((err) => {
        console.error("Error calculando precios:", err)
      })
      .finally(() => {
        setCalculandoPrecios(false)
      })
  }, [datosAcademicos.programa, datosAcademicos.duracion, datosFinancieros.tieneConvenio, datosFinancieros.convenioId])

  // Actualizar duración cuando cambia el programa (solo si no tiene valor manual)
  const prevProgramaRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!datosAcademicos.programa) return
    const prog = programasUnicos.find((p) => p.id.toString() === datosAcademicos.programa)
    // Solo auto-setear duración cuando el programa cambia (no al cargar por primera vez con datos existentes)
    if (prog && prog.meses && prevProgramaRef.current !== undefined && prevProgramaRef.current !== datosAcademicos.programa) {
      setDatosAcademicos(prev => ({
        ...prev,
        duracion: prog.meses.toString(),
        titulo1: datosAcademicos.programa,
        titulo1_duracion: prog.meses.toString(),
      }))
    }
    prevProgramaRef.current = datosAcademicos.programa
  }, [datosAcademicos.programa, programasUnicos])

  // Vista previa de documentos
  const [previewDoc, setPreviewDoc] = useState<any>(null)

  // Documentos agrupados por tipo (más reciente de cada tipo)
  const documentosPorTipo = useMemo(() => {
    const map = new Map<string, any>()
    documentos.forEach((doc) => {
      const tipo = doc.tipo_documento || "otros"
      const existing = map.get(tipo)
      if (!existing || new Date(doc.created_at) > new Date(existing.created_at)) {
        map.set(tipo, doc)
      }
    })
    return map
  }, [documentos])

  if (loadingData) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Editar Prospecto - ID: {formData.id}</span>
            {tieneFicha && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Tiene Ficha
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            {tieneFicha 
              ? "Este prospecto tiene una ficha de inscripción. Puedes editar los datos completados."
              : "Completa los datos del prospecto. Los campos marcados con ✓ ya tienen información."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basicos" className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="basicos">Básicos</TabsTrigger>
                <TabsTrigger value="profesional">Profesional</TabsTrigger>
                <TabsTrigger value="academico">Académico</TabsTrigger>
                <TabsTrigger value="financiero">Financiero</TabsTrigger>
                <TabsTrigger value="laboral">Laboral</TabsTrigger>
                <TabsTrigger value="documentos">Documentos</TabsTrigger>
                <TabsTrigger value="notas">Notas</TabsTrigger>
              </TabsList>

              {/* Tab 1: Datos Básicos */}
              <TabsContent value="basicos" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nombre Completo <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.nombre_completo}
                      onChange={(e) => handleChange("nombre_completo", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Género</label>
                    <Select value={formData.genero} onValueChange={(v) => handleChange("genero", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Teléfono <span className="text-xs text-gray-500">(Opcional si hay correo)</span>
                    </label>
                    <Input
                      value={formData.telefono || ""}
                      onChange={(e) => handleChange("telefono", e.target.value)}
                      placeholder="Mínimo 8 dígitos"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Correo Electrónico <span className="text-xs text-gray-500">(Opcional si hay teléfono)</span>
                    </label>
                    <Input
                      type="email"
                      value={formData.correo_electronico || ""}
                      onChange={(e) => handleChange("correo_electronico", e.target.value)}
                      placeholder="ejemplo@correo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Estado</label>
                    <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="No contactado">No contactado</SelectItem>
                        <SelectItem value="En seguimiento">En seguimiento</SelectItem>
                        <SelectItem value="Le interesa a futuro">Le interesa a futuro</SelectItem>
                        <SelectItem value="Perdido">Perdido</SelectItem>
                        <SelectItem value="Inscrito">Inscrito</SelectItem>
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="Promesa de pago">Promesa de pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Medio de Conocimiento</label>
                    <Select 
                      value={formData.medio_conocimiento_institucion || ""} 
                      onValueChange={(v) => handleChange("medio_conocimiento_institucion", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione origen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="referido">Referido</SelectItem>
                        <SelectItem value="whatsapp_corporativo">WhatsApp Corporativo</SelectItem>
                        <SelectItem value="pagina_web">Página Web</SelectItem>
                        <SelectItem value="actividades_escritorio">Actividades de Escritorio</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 text-sm text-gray-700">Ubicación</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">País</label>
                      <Input
                        value={formData.pais_nombre || ""}
                        onChange={(e) => handleChange("pais_nombre", e.target.value)}
                        placeholder="Ej: Guatemala"
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Departamento</label>
                      <Input
                        value={formData.departamento_nombre || ""}
                        onChange={(e) => handleChange("departamento_nombre", e.target.value)}
                        placeholder="Ej: Guatemala"
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Municipio</label>
                      <Input
                        value={formData.municipio_nombre || ""}
                        onChange={(e) => handleChange("municipio_nombre", e.target.value)}
                        placeholder="Ej: Guatemala"
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * La ubicación se establece en la captura inicial y no se puede editar
                  </p>
                </div>
              </TabsContent>

              {/* Tab 2: Información Profesional */}
              <TabsContent value="profesional" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Empresa Actual</label>
                    <Input
                      value={formData.empresa_donde_labora_actualmente || ""}
                      onChange={(e) => handleChange("empresa_donde_labora_actualmente", e.target.value)}
                      placeholder="Nombre de la empresa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Puesto</label>
                    <Input
                      value={formData.puesto || ""}
                      onChange={(e) => handleChange("puesto", e.target.value)}
                      placeholder="Cargo o puesto"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      DPI / Identificación
                      <span className="text-xs text-gray-500 ml-2">(13 dígitos para Guatemala)</span>
                    </label>
                    <Input
                      value={formData.numero_identificacion || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        // Solo permitir números y limitar a 13 caracteres
                        if (value === "" || /^\d{0,13}$/.test(value)) {
                          handleChange("numero_identificacion", value)
                        }
                      }}
                      placeholder="Número de identificación"
                      maxLength={13}
                    />
                    {formData.numero_identificacion && formData.numero_identificacion.length !== 13 && (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠️ El DPI debe tener exactamente 13 dígitos
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Programa de Interés</label>
                    <Select 
                      value={formData.interes || "sin_programa"} 
                      onValueChange={(v) => handleChange("interes", v === "sin_programa" ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un programa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sin_programa">Sin programa</SelectItem>
                        {programas.map((prog) => (
                          <SelectItem key={prog.id} value={String(prog.id)}>
                            {prog.nombre_del_programa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Académico */}
              <TabsContent value="academico" className="space-y-4 mt-4">
                {tieneFicha && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Este prospecto tiene datos académicos registrados. Los campos con ✓ ya están completados.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Programa Académico */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      Programa Académico <span className="text-red-500">*</span>
                      {hasField(datosAcademicos.programa) && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </label>
                    <Select 
                      value={datosAcademicos.programa || ""} 
                      onValueChange={(v) => setDatosAcademicos(prev => ({ ...prev, programa: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar programa" />
                      </SelectTrigger>
                      <SelectContent>
                        {programasUnicos.map((prog) => (
                          <SelectItem key={prog.id} value={prog.id.toString()}>
                            {prog.abreviatura} – {prog.nombre_del_programa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Selecciona el programa para crear el registro en estudiante_programa
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      Duración (meses)
                      {hasField(datosAcademicos.duracion) && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </label>
                    <Input
                      type="number"
                      value={datosAcademicos.duracion || ""}
                      onChange={(e) => setDatosAcademicos(prev => ({ ...prev, duracion: e.target.value }))}
                      placeholder="Meses"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      Modalidad
                      {hasField(datosAcademicos.modalidad) && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </label>
                    <Select 
                      value={datosAcademicos.modalidad || ""} 
                      onValueChange={(v) => setDatosAcademicos(prev => ({ ...prev, modalidad: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar modalidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sincronica">Sincrónica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      Fecha de Inicio Específica
                      {hasField(datosAcademicos.fechaInicioEspecifica) && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </label>
                    <SimpleDatePicker
                      value={datosAcademicos.fechaInicioEspecifica || ""}
                      onChange={(v) => setDatosAcademicos(prev => ({ ...prev, fechaInicioEspecifica: v }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      Fecha Taller Inducción
                      {hasField(datosAcademicos.fechaTallerInduccion) && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </label>
                    <SimpleDatePicker
                      value={datosAcademicos.fechaTallerInduccion || ""}
                      onChange={(v) => setDatosAcademicos(prev => ({ ...prev, fechaTallerInduccion: v }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      Fecha Taller Integración
                      {hasField(datosAcademicos.fechaTallerIntegracion) && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </label>
                    <SimpleDatePicker
                      value={datosAcademicos.fechaTallerIntegracion || ""}
                      onChange={(v) => setDatosAcademicos(prev => ({ ...prev, fechaTallerIntegracion: v }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      Último Título Obtenido
                      {hasField(datosAcademicos.ultimoTitulo) && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </label>
                    <Select 
                      value={datosAcademicos.ultimoTitulo || ""} 
                      onValueChange={(v) => setDatosAcademicos(prev => ({ ...prev, ultimoTitulo: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar título" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diversificado">Diversificado</SelectItem>
                        <SelectItem value="tecnico">Técnico</SelectItem>
                        <SelectItem value="licenciatura">Licenciatura</SelectItem>
                        <SelectItem value="maestria">Maestría</SelectItem>
                        <SelectItem value="doctorado">Doctorado</SelectItem>
                        <SelectItem value="cierre_pensum">Cierre de Pénsum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      Institución Anterior
                      {hasField(datosAcademicos.institucionAnterior) && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </label>
                    <Input
                      value={datosAcademicos.institucionAnterior || ""}
                      onChange={(e) => setDatosAcademicos(prev => ({ ...prev, institucionAnterior: e.target.value }))}
                      placeholder="Nombre de la institución"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      Año de Graduación
                      {hasField(datosAcademicos.añoGraduacion) && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </label>
                    <Input
                      type="number"
                      min="1950"
                      max={new Date().getFullYear()}
                      value={datosAcademicos.añoGraduacion || ""}
                      onChange={(e) => setDatosAcademicos(prev => ({ ...prev, añoGraduacion: e.target.value }))}
                      placeholder="Año"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      Cursos Aprobados
                      {hasField(datosAcademicos.cursosAprobados) && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </label>
                    <Input
                      type="number"
                      value={datosAcademicos.cursosAprobados || ""}
                      onChange={(e) => setDatosAcademicos(prev => ({ ...prev, cursosAprobados: e.target.value }))}
                      placeholder="Cantidad de cursos"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      Día de Estudio
                      {hasField(datosAcademicos.diaEstudio) && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </label>
                    <Input
                      value={datosAcademicos.diaEstudio || ""}
                      onChange={(e) => setDatosAcademicos(prev => ({ ...prev, diaEstudio: e.target.value }))}
                      placeholder="Ej: lunes, martes"
                    />
                  </div>
                </div>

                {/* Programas Inscritos - con opción de eliminar */}
                {programasInscritos.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                      <h4 className="text-sm font-semibold text-gray-800">Programas Inscritos ({programasInscritos.length})</h4>
                    </div>
                    {programasInscritos.map((ep: any) => {
                      const nombreProg = ep.programa?.abreviatura
                        ? `${ep.programa.abreviatura} – ${ep.programa.nombre_del_programa}`
                        : programas.find((p: any) => p.id === ep.programa_id)?.nombre_del_programa || `Programa ${ep.programa_id}`
                      return (
                        <div key={ep.id} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <span className="text-sm font-semibold text-gray-800">{nombreProg}</span>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 mt-2 text-xs text-gray-600">
                                {ep.fecha_inicio && (
                                  <span><span className="font-medium text-gray-500">Inicio:</span> {new Date(ep.fecha_inicio).toLocaleDateString("es-GT")}</span>
                                )}
                                {ep.fecha_fin && (
                                  <span><span className="font-medium text-gray-500">Fin:</span> {new Date(ep.fecha_fin).toLocaleDateString("es-GT")}</span>
                                )}
                                {ep.duracion_meses && (
                                  <span><span className="font-medium text-gray-500">Duración:</span> {ep.duracion_meses} meses</span>
                                )}
                                {ep.inscripcion != null && (
                                  <span><span className="font-medium text-gray-500">Inscripción:</span> Q{Number(ep.inscripcion).toFixed(2)}</span>
                                )}
                                {ep.cuota_mensual != null && (
                                  <span><span className="font-medium text-gray-500">Cuota:</span> Q{Number(ep.cuota_mensual).toFixed(2)}/mes</span>
                                )}
                                {ep.inversion_total != null && (
                                  <span><span className="font-medium text-gray-500">Total:</span> Q{Number(ep.inversion_total).toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 ml-2 flex-shrink-0"
                              title="Eliminar programa y datos asociados"
                              onClick={() => handleEliminarProgramaInscrito(ep, nombreProg)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="financiero" className="space-y-4 mt-4">
                {tieneFicha && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Este prospecto tiene datos financieros registrados. Los campos con ✓ ya están completados.
                    </AlertDescription>
                  </Alert>
                )}

                {!datosAcademicos.programa && (
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertDescription className="text-yellow-800">
                      ⚠️ Selecciona un programa académico primero para calcular los precios automáticamente.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      ¿Posee convenio corporativo?
                      {hasField(datosFinancieros.tieneConvenio) && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </label>
                    <Select 
                      value={datosFinancieros.tieneConvenio ? "si" : "no"} 
                      onValueChange={(v) => {
                        const tiene = v === "si"
                        setDatosFinancieros(prev => ({
                          ...prev,
                          tieneConvenio: tiene,
                          convenioId: tiene ? prev.convenioId : undefined,
                        }))
                      }}
                      disabled={calculandoPrecios}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sí</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {datosFinancieros.tieneConvenio && (
                    <div>
                      <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                        Seleccionar convenio
                        {hasField(datosFinancieros.convenioId) && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </label>
                      <Select 
                        value={datosFinancieros.convenioId?.toString() || ""} 
                        onValueChange={(v) => setDatosFinancieros(prev => ({ ...prev, convenioId: Number(v) }))}
                        disabled={calculandoPrecios}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Convenio" />
                        </SelectTrigger>
                        <SelectContent>
                          {convenios.map((conv) => (
                            <SelectItem key={conv.id} value={String(conv.id)}>
                              {conv.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      Modalidad de Pago
                      {hasField(datosFinancieros.formaPago) && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </label>
                    <Select 
                      value={datosFinancieros.formaPago || ""} 
                      onValueChange={(v) => setDatosFinancieros(prev => ({ ...prev, formaPago: v as any }))}
                      disabled={calculandoPrecios}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar método" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deposito">Depósito</SelectItem>
                        <SelectItem value="debito">Débito</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className={`md:col-span-2 grid grid-cols-4 gap-4 ${calculandoPrecios ? "opacity-50" : ""}`}>
                    <div>
                      <label className="block text-sm font-medium mb-1">Inscripción (Q)</label>
                      <Input
                        type="number"
                        value={datosFinancieros.inscripcion || ""}
                        onChange={(e) => setDatosFinancieros(prev => ({ ...prev, inscripcion: e.target.value }))}
                        placeholder="Auto"
                        disabled={calculandoPrecios}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Cuota Mensual (Q)</label>
                      <Input
                        type="number"
                        value={datosFinancieros.cuotaMensual || ""}
                        onChange={(e) => setDatosFinancieros(prev => ({ ...prev, cuotaMensual: e.target.value }))}
                        placeholder="Auto"
                        disabled={calculandoPrecios}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Cantidad Meses</label>
                      <Input
                        type="number"
                        value={datosFinancieros.cantidadMeses || ""}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Inversión Total (Q)</label>
                      <Input
                        type="number"
                        value={datosFinancieros.inversionTotal || ""}
                        readOnly
                        className="bg-gray-50 font-bold"
                      />
                    </div>
                  </div>

                  {calculandoPrecios && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Calculando precios...
                    </div>
                  )}

                  {estudiantePrograma && cuotasEstudiante.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="font-medium mb-2">Cuotas del Estudiante</h4>
                      <div className="max-h-48 overflow-y-auto">
                        <div className="space-y-2">
                          {cuotasEstudiante.slice(0, 5).map((cuota: any) => (
                            <div key={cuota.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm">
                                {cuota.concepto} - Cuota #{cuota.numero_cuota}
                              </span>
                              <Badge variant={cuota.estado === "pagado" ? "default" : "secondary"}>
                                {cuota.estado}
                              </Badge>
                            </div>
                          ))}
                          {cuotasEstudiante.length > 5 && (
                            <p className="text-xs text-gray-500 text-center">
                              ... y {cuotasEstudiante.length - 5} cuotas más
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab 5: Laboral */}
              <TabsContent value="laboral" className="space-y-4 mt-4">
                {tieneFicha && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Este prospecto tiene datos laborales registrados. Los campos con ✓ ya están completados.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      Teléfono Corporativo
                      {hasField(datosLaborales.telefonoCorporativo) && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </label>
                    <Input
                      value={datosLaborales.telefonoCorporativo || ""}
                      onChange={(e) => setDatosLaborales(prev => ({ ...prev, telefonoCorporativo: e.target.value }))}
                      placeholder="Teléfono de la empresa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      Departamento
                      {hasField(datosLaborales.departamento) && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </label>
                    <Select 
                      value={datosLaborales.departamento || ""} 
                      onValueChange={(v) => setDatosLaborales(prev => ({ ...prev, departamento: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {departamentos.map((dept) => (
                          <SelectItem key={dept.id} value={dept.nombre}>
                            {dept.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      Dirección de la Empresa
                      {hasField(datosLaborales.direccionEmpresa) && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </label>
                    <Textarea
                      value={datosLaborales.direccionEmpresa || ""}
                      onChange={(e) => setDatosLaborales(prev => ({ ...prev, direccionEmpresa: e.target.value }))}
                      placeholder="Dirección completa de la empresa"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      Sector de la Empresa
                      {hasField(datosLaborales.sectorEmpresa) && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </label>
                    <Input
                      value={datosLaborales.sectorEmpresa || ""}
                      onChange={(e) => setDatosLaborales(prev => ({ ...prev, sectorEmpresa: e.target.value }))}
                      placeholder="Sector empresarial"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab 6: Documentos */}
              <TabsContent value="documentos" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Documentos del Prospecto</h3>
                    <Badge variant="outline">{documentosPorTipo.size} tipo{documentosPorTipo.size !== 1 ? "s" : ""} de documento</Badge>
                  </div>

                  {documentosPorTipo.size === 0 ? (
                    <Alert>
                      <AlertDescription>
                        No hay documentos subidos para este prospecto.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from(documentosPorTipo.entries()).map(([tipo, doc]) => {
                        const esBoleta = tipo === "inscripcion"
                        return (
                          <div key={doc.id} className={`border rounded-lg p-4 ${esBoleta ? "bg-blue-50 border-blue-200" : ""}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">
                                  {tipo === "inscripcion" ? "Boleta de Inscripción" : 
                                   tipo === "dpi" ? "DPI (ambos lados)" :
                                   tipo === "recibo" ? "Recibo de luz o teléfono" :
                                   tipo === "american" ? "Recibo de American" :
                                   tipo === "foto" ? "Fotografía reciente" :
                                   tipo === "titulo" ? "Título o Diploma" :
                                   tipo === "cierrePensum" ? "Cierre de Pénsum" :
                                   tipo === "certificacionCursos" ? "Certificación de cursos" :
                                   tipo === "carnetColaborador" ? "Carnet de Colaborador" :
                                   tipo === "autorizacionAcademica" ? "Autorización Académica" :
                                   tipo === "autorizacionFinanciera" ? "Autorización Financiera" :
                                   tipo === "autorizacionAsociaciones" ? "Autorización Asociaciones" :
                                   tipo === "valeDescuento" ? "Vale de Descuento" :
                                   tipo === "mensajeFinal" ? "Mensaje Final" : 
                                   "Otros"}
                                </span>
                                {esBoleta && (
                                  <Badge variant="secondary" className="text-xs">Solo lectura</Badge>
                                )}
                              </div>
                              <Badge variant={
                                doc.estado === "aprobado" ? "default" : 
                                doc.estado === "rechazado" ? "destructive" : 
                                "secondary"
                              }>
                                {doc.estado || "pendiente"}
                              </Badge>
                            </div>
                            {doc.ruta_archivo && (
                              <div className="flex gap-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPreviewDoc(doc)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <a href={getDocUrl(doc)} download>
                                    <FileText className="h-4 w-4 mr-1" />
                                    Descargar
                                  </a>
                                </Button>
                                {!esBoleta && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      const result = await Swal.fire({
                                        icon: "question",
                                        title: "¿Eliminar documento?",
                                        text: "Esta acción no se puede deshacer",
                                        showCancelButton: true,
                                        confirmButtonText: "Sí, eliminar",
                                        cancelButtonText: "Cancelar",
                                      })
                                      if (result.isConfirmed) {
                                        try {
                                          const token = localStorage.getItem("token")
                                          await axios.delete(`${API_URL}/documentos/${doc.id}`, {
                                            headers: { Authorization: `Bearer ${token}` },
                                          })
                                          setDocumentos(prev => prev.filter(d => d.id !== doc.id))
                                          Swal.fire({
                                            icon: "success",
                                            title: "Documento eliminado",
                                            timer: 2000,
                                            showConfirmButton: false,
                                          })
                                        } catch (err) {
                                          Swal.fire({
                                            icon: "error",
                                            title: "Error",
                                            text: "No se pudo eliminar el documento",
                                          })
                                        }
                                      }
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  </Button>
                                )}
                              </div>
                            )}
                            {doc.metadata && (
                              <div className="mt-2 text-xs text-gray-500">
                                {JSON.parse(doc.metadata).numero_boleta && (
                                  <p>Boleta: {JSON.parse(doc.metadata).numero_boleta}</p>
                                )}
                                {JSON.parse(doc.metadata).banco && (
                                  <p>Banco: {JSON.parse(doc.metadata).banco}</p>
                                )}
                                {JSON.parse(doc.metadata).monto && (
                                  <p>Monto: Q{JSON.parse(doc.metadata).monto}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Subir Nuevo Documento</h4>
                    <div className="space-y-4">
                      <div>
                        <Label>Tipo de Documento</Label>
                        <Select onValueChange={(tipo) => {
                          const input = document.getElementById("file-input") as HTMLInputElement
                          if (input) {
                            input.setAttribute("data-tipo", tipo)
                          }
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dpi">DPI (ambos lados)</SelectItem>
                            <SelectItem value="recibo">Recibo de luz o teléfono</SelectItem>
                            <SelectItem value="american">Recibo de American</SelectItem>
                            <SelectItem value="foto">Fotografía reciente</SelectItem>
                            <SelectItem value="titulo">Título o Diploma</SelectItem>
                            <SelectItem value="cierrePensum">Cierre de Pénsum</SelectItem>
                            <SelectItem value="certificacionCursos">Certificación de cursos aprobados</SelectItem>
                            <SelectItem value="carnetColaborador">Carnet de Colaborador</SelectItem>
                            <SelectItem value="autorizacionAcademica">Autorización Académica</SelectItem>
                            <SelectItem value="autorizacionFinanciera">Autorización Financiera</SelectItem>
                            <SelectItem value="autorizacionAsociaciones">Autorización Asociaciones</SelectItem>
                            <SelectItem value="valeDescuento">Vale de Descuento</SelectItem>
                            <SelectItem value="mensajeFinal">Mensaje Final</SelectItem>
                            <SelectItem value="otros">Otros documentos</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          Nota: La boleta de inscripción solo se puede subir desde el flujo de inscripción
                        </p>
                      </div>
                      <div>
                        <Label>Archivo (Drag & Drop o Click)</Label>
                        <div
                          id="drop-zone"
                          className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-400 cursor-pointer transition-colors"
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.add("border-blue-500", "bg-blue-50")
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove("border-blue-500", "bg-blue-50")
                          }}
                          onDrop={async (e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove("border-blue-500", "bg-blue-50")
                            const file = e.dataTransfer.files[0]
                            if (!file) return
                            
                            const input = document.getElementById("file-input") as HTMLInputElement
                            const tipo = input?.getAttribute("data-tipo")
                            if (!tipo) {
                              Swal.fire({
                                icon: "warning",
                                title: "Seleccione tipo",
                                text: "Por favor seleccione el tipo de documento primero",
                              })
                              return
                            }
                            
                            await handleFileUpload(tipo, file)
                          }}
                          onClick={() => document.getElementById("file-input")?.click()}
                        >
                          <Upload className="mx-auto h-12 w-12 text-blue-400 mb-2" />
                          <p className="text-sm text-gray-600">Arrastra un archivo aquí o haz clic para seleccionar</p>
                          <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (máx. 5MB)</p>
                        </div>
                        <Input
                          id="file-input"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            
                            const tipo = e.target.getAttribute("data-tipo")
                            if (!tipo) {
                              Swal.fire({
                                icon: "warning",
                                title: "Seleccione tipo",
                                text: "Por favor seleccione el tipo de documento primero",
                              })
                              return
                            }
                            
                            await handleFileUpload(tipo, file)
                            e.target.value = ""
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Notas */}
              <TabsContent value="notas" className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Notas Generales</label>
                  <Textarea
                    value={formData.notas_generales || ""}
                    onChange={(e) => handleChange("notas_generales", e.target.value)}
                    placeholder="Información general del prospecto..."
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Observaciones</label>
                  <Textarea
                    value={formData.observaciones || ""}
                    onChange={(e) => handleChange("observaciones", e.target.value)}
                    placeholder="Observaciones específicas, seguimientos, etc..."
                    rows={4}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>

      {/* Modal de vista previa de documentos */}
      <ServerFilePreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        fileUrl={previewDoc ? getDocUrl(previewDoc) : null}
        fileName={previewDoc?.ruta_archivo?.split("/").pop() || `documento-${previewDoc?.id}`}
        tipoDocumento={previewDoc?.tipo_documento}
        estado={previewDoc?.estado}
        authToken={typeof window !== "undefined" ? localStorage.getItem("token") : null}
      />
    </Dialog>
  )
}
