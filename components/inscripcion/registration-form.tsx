"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import Swal from 'sweetalert2'


import type {
  DatosPersonales,
  DatosLaborales,
  DatosAcademicos,
  DatosFinancieros,
  Documento,
  TabId,
} from "./types"

import PersonalTab from "./tabs/PersonalTab"
import LaboralTab from "./tabs/LaboralTab"
import AcademicoTab from "./tabs/AcademicoTab"
import FinancieroTab from "./tabs/FinancieroTab"
import DocumentosTab, { DOCUMENTOS_DEFAULT } from "./tabs/DocumentosTab"
import ProspectSearchModal from "./tabs/ProspectSearchModal"
import DraftManager from "./DraftManager"
import type { ProgramaConDuracion } from "./types"
import type { DuplicateProspect } from "@/hooks/useDuplicateProspectCheck"
import { useDraftCache } from "@/hooks/useDraftCache"

import axios from "axios"
import { api } from "@/services/api"
import { API_BASE_URL } from "@/utils/apiConfig"
// ── Valores iniciales para resetear formulario ──────────────────────────────
const INITIAL_PERSONAL: DatosPersonales = {
  nombre: "", paisOrigen: "", paisResidencia: "", telefono: "",
  dpi: "", emailPersonal: "", emailCorporativo: "",
  fechaNacimiento: "", direccion: "", esReinscripcion: false
}

const INITIAL_ACADEMICO: DatosAcademicos = {
  programa: "", duracion: "", ultimoTitulo: "licenciatura", modalidad: "sincronica",
  fechaInicio: "", diaEstudio: "jueves", fechaInicioEspecifica: "",
  fechaTallerInduccion: "", fechaTallerIntegracion: "", institucionAnterior: "",
  añoGraduacion: "", medioConocio: "", observaciones: "",
  cursosAprobados: "", titulo1: "", titulo1_duracion: "",
  titulo2: "", titulo2_duracion: "", titulo3: "", titulo3_duracion: "",
  carrera: "",
}

const INITIAL_LABORAL: DatosLaborales = {
  empresa: "", puesto: "", telefonoCorporativo: "", departamento: "",
  sectorEmpresa: "", direccionEmpresa: ""
}

const INITIAL_FINANCIERO: DatosFinancieros = {
  inscripcion: "1,000.00", cuotaMensual: "1,400.00", cantidadMeses: "18",
  inversionTotal: "26,200.00", formaPago: "debito", referencia: "",
  aceptaTerminos: false, tieneConvenio: false
}

export default function RegistrationForm() {
  const searchParams = useSearchParams()
  const prospectoIdFromUrl = searchParams.get("prospectoId")
  const prospectFromUrlLoadedRef = useRef<string | null>(null)

  const [activeTab, setActiveTab] = useState<TabId>("personal")
  const [progress, setProgress] = useState(20)
  const [showModal, setShowModal] = useState(false)
  const [prospectoId, setProspectoId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [estudianteProgramaIds, setEstudianteProgramaIds] = useState<number[]>([])
  const [loadingProspectFromUrl, setLoadingProspectFromUrl] = useState(false)
  /** Evitar que FinancieroTab sobrescriba con precios por defecto cuando los datos vienen del prospecto (Alerta) */
  const [preserveFinancialFromProspect, setPreserveFinancialFromProspect] = useState(false)

  const [datosPersonales, setDatosPersonales] = useState<DatosPersonales>({ ...INITIAL_PERSONAL })

  const [datosAcademicos, setDatosAcademicos] = useState<DatosAcademicos>({ ...INITIAL_ACADEMICO })

  const programasParaFinanciero: ProgramaConDuracion[] = [
    { programaId: Number(datosAcademicos.titulo1), duracion: Number(datosAcademicos.titulo1_duracion) },
    { programaId: Number(datosAcademicos.titulo2), duracion: Number(datosAcademicos.titulo2_duracion) },
    { programaId: Number(datosAcademicos.titulo3), duracion: Number(datosAcademicos.titulo3_duracion) },
  ].filter(p => p.programaId > 0 && p.duracion > 0)

  const [datosLaborales, setDatosLaborales] = useState<DatosLaborales>({ ...INITIAL_LABORAL })

  const [datosFinancieros, setDatosFinancieros] = useState<DatosFinancieros>({ ...INITIAL_FINANCIERO })

  const [documentos, setDocumentos] = useState<Documento[]>(DOCUMENTOS_DEFAULT)

  // ── Sistema de borradores (máx. 3 por asesor) ──────────────────────────────
  const {
    drafts,
    activeDraftId,
    synced,
    saveDraft,
    loadDraft,
    deleteDraft,
    clearAllDrafts,
    updateAutoSaveData,
    setActiveDraftId,
    maxDrafts,
  } = useDraftCache({ maxDrafts: 3, autoSaveInterval: 30_000 })

  // Cargar prospecto desde URL (ej. /inscripcion/ficha?prospectoId=3202) y rellenar formulario; en Info. Académica usar programa de interés si no tiene programas inscritos
  useEffect(() => {
    const id = prospectoIdFromUrl ? parseInt(prospectoIdFromUrl, 10) : null
    if (!id || !Number.isFinite(id) || prospectFromUrlLoadedRef.current === prospectoIdFromUrl) return

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) return

    prospectFromUrlLoadedRef.current = prospectoIdFromUrl
    setLoadingProspectFromUrl(true)

    fetch(`${API_BASE_URL}/api/prospectos/${id}`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Prospecto no encontrado")
        return res.json()
      })
      .then((json: { data?: any }) => {
        const data = json.data || json
        setProspectoId(data.id)

        setDatosPersonales((prev) => ({
          ...prev,
          nombre: data.nombre_completo || "",
          paisOrigen: data.pais_nombre || data.pais_origen || "",
          paisResidencia: data.pais_nombre || data.pais_residencia || "",
          telefono: data.telefono || "",
          dpi: data.numero_identificacion || "",
          emailPersonal: data.correo_electronico || "",
          emailCorporativo: data.correo_corporativo || "",
          fechaNacimiento: data.fecha_nacimiento
            ? new Date(data.fecha_nacimiento).toISOString().split("T")[0]
            : "",
          direccion: data.direccion_residencia || "",
        }))

        setDatosLaborales((prev) => ({
          ...prev,
          empresa: data.empresa_donde_labora_actualmente || "",
          puesto: data.puesto || "",
          telefonoCorporativo: data.telefono_corporativo || "",
          departamento: data.departamento || "",
          direccionEmpresa: data.direccion_empresa || "",
          sectorEmpresa: data.sector_empresa || "",
        }))

        const programas = Array.isArray(data.programas) ? data.programas : []
        const primerPrograma = programas[0]
        const p2 = programas[1]
        const p3 = programas[2]
        const programaPrincipal =
          primerPrograma?.programa_id != null
            ? String(primerPrograma.programa_id)
            : data.interes
              ? String(data.interes)
              : ""
        const duracionPrincipal =
          primerPrograma?.duracion_meses != null
            ? String(primerPrograma.duracion_meses)
            : primerPrograma?.programa?.meses != null
              ? String(primerPrograma.programa.meses)
              : ""
        const titulo2 = p2?.programa_id != null ? String(p2.programa_id) : ""
        const titulo2Dur = p2?.duracion_meses != null ? String(p2.duracion_meses) : p2?.programa?.meses != null ? String(p2.programa.meses) : ""
        const titulo3 = p3?.programa_id != null ? String(p3.programa_id) : ""
        const titulo3Dur = p3?.duracion_meses != null ? String(p3.duracion_meses) : p3?.programa?.meses != null ? String(p3.programa.meses) : ""

        setDatosAcademicos((prev) => ({
          ...prev,
          programa: programaPrincipal,
          duracion: duracionPrincipal,
          titulo1: programaPrincipal,
          titulo1_duracion: duracionPrincipal,
          titulo2,
          titulo2_duracion: titulo2Dur,
          titulo3,
          titulo3_duracion: titulo3Dur,
          ultimoTitulo: (data.ultimo_titulo_obtenido as DatosAcademicos["ultimoTitulo"]) || "licenciatura",
          institucionAnterior: data.institucion_titulo || "",
          añoGraduacion: data.anio_graduacion?.toString() || "",
          modalidad: (data.modalidad as "sincronica") || "sincronica",
          fechaInicioEspecifica: data.fecha_inicio_especifica
            ? (data.fecha_inicio_especifica.split?.("T")[0] || data.fecha_inicio_especifica.split?.(" ")[0] || "")
            : "",
          fechaTallerInduccion: data.fecha_taller_reduccion
            ? (data.fecha_taller_reduccion.split?.("T")[0] || data.fecha_taller_reduccion.split?.(" ")[0] || "")
            : "",
          fechaTallerIntegracion: data.fecha_taller_integracion
            ? (data.fecha_taller_integracion.split?.("T")[0] || data.fecha_taller_integracion.split?.(" ")[0] || "")
            : "",
          medioConocio: (data.medio_conocimiento_institucion as DatosAcademicos["medioConocio"]) || "",
          cursosAprobados: data.cantidad_cursos_aprobados?.toString() || "",
          diaEstudio: (data.dia_estudio as DatosAcademicos["diaEstudio"]) || "jueves",
          observaciones: data.observaciones || "",
        }))

        // Siempre traer datos financieros del programa principal (lo integrado en Alerta Alumno Nuevo)
        setDatosFinancieros((prev) => ({
          ...prev,
          inscripcion:
            primerPrograma != null && primerPrograma.inscripcion != null && String(primerPrograma.inscripcion).trim() !== ""
              ? String(primerPrograma.inscripcion)
              : data.monto_inscripcion != null && String(data.monto_inscripcion).trim() !== ""
                ? String(data.monto_inscripcion)
                : prev.inscripcion,
          cuotaMensual:
            primerPrograma != null && primerPrograma.cuota_mensual != null && String(primerPrograma.cuota_mensual).trim() !== ""
              ? String(primerPrograma.cuota_mensual)
              : prev.cuotaMensual,
          inversionTotal:
            primerPrograma != null && primerPrograma.inversion_total != null && String(primerPrograma.inversion_total).trim() !== ""
              ? String(primerPrograma.inversion_total)
              : prev.inversionTotal,
          cantidadMeses:
            primerPrograma != null && primerPrograma.duracion_meses != null
              ? String(primerPrograma.duracion_meses)
              : prev.cantidadMeses,
          formaPago: (data.metodo_pago as DatosFinancieros["formaPago"]) || prev.formaPago,
          convenioId: data.convenio_pago_id ?? prev.convenioId,
          tieneConvenio: !!data.convenio_pago_id || prev.tieneConvenio,
        }))
        setPreserveFinancialFromProspect(true)
      })
      .catch(() => {
        prospectFromUrlLoadedRef.current = null
      })
      .finally(() => {
        setLoadingProspectFromUrl(false)
      })
  }, [prospectoIdFromUrl])

  /** Construye el payload serializable del formulario */
  const buildPayload = useCallback(() => ({
    datosPersonales,
    datosLaborales,
    datosAcademicos,
    datosFinancieros,
    prospectoId,
    activeTab,
    progress,
  }), [datosPersonales, datosLaborales, datosAcademicos, datosFinancieros, prospectoId, activeTab, progress])

  // Mantener ref actualizada para auto-save
  useEffect(() => {
    const label = datosPersonales.nombre || "Borrador sin nombre"
    updateAutoSaveData(label, activeTab, progress, buildPayload())
  }, [datosPersonales, datosLaborales, datosAcademicos, datosFinancieros, activeTab, progress, buildPayload, updateAutoSaveData])

  /** Guardar borrador manualmente */
  const handleSaveDraft = useCallback(() => {
    const label = datosPersonales.nombre || "Borrador sin nombre"
    saveDraft(label, activeTab, progress, buildPayload())
    Swal.fire({
      icon: "success",
      title: "Borrador guardado",
      text: `"${label}" guardado correctamente.`,
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
    })
  }, [saveDraft, activeTab, progress, buildPayload, datosPersonales.nombre])

  /** Crear nuevo borrador (limpia formulario) */
  const handleNewDraft = useCallback(() => {
    setActiveDraftId(null)
    setProspectoId(null)
    setDatosPersonales({ ...INITIAL_PERSONAL })
    setDatosLaborales({ ...INITIAL_LABORAL })
    setDatosAcademicos({ ...INITIAL_ACADEMICO })
    setDatosFinancieros({ ...INITIAL_FINANCIERO })
    setDocumentos(DOCUMENTOS_DEFAULT)
    setActiveTab("personal")
    setProgress(20)
  }, [setActiveDraftId])

  /** Cargar un borrador existente */
  const handleLoadDraft = useCallback((draftId: string) => {
    const draft = loadDraft(draftId)
    if (!draft) return
    const p = draft.payload as any
    if (p.datosPersonales) setDatosPersonales(p.datosPersonales)
    if (p.datosLaborales) setDatosLaborales(p.datosLaborales)
    if (p.datosAcademicos) setDatosAcademicos(p.datosAcademicos)
    if (p.datosFinancieros) setDatosFinancieros(p.datosFinancieros)
    if (p.prospectoId !== undefined) setProspectoId(p.prospectoId)
    if (p.activeTab) {
      setActiveTab(p.activeTab as TabId)
      setProgress(p.progress || 20)
    }
    Swal.fire({
      icon: "success",
      title: "Borrador cargado",
      text: `Se restauró "${draft.label}".`,
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
    })
  }, [loadDraft])

  /** Eliminar borrador */
  const handleDeleteDraft = useCallback((draftId: string) => {
    deleteDraft(draftId)
  }, [deleteDraft])

  const changeTab = (tab: TabId) => {
    // Auto-guardar borrador al cambiar de pestaña
    const newProgress = tab === "personal" ? 20 : tab === "laboral" ? 40 : tab === "academico" ? 60 : tab === "financiero" ? 80 : 100
    const label = datosPersonales.nombre || "Borrador sin nombre"
    saveDraft(label, tab, newProgress, {
      datosPersonales, datosLaborales, datosAcademicos, datosFinancieros, prospectoId,
      activeTab: tab, progress: newProgress,
    })
    setActiveTab(tab)
    setProgress(newProgress)
  }

  // 🔍 Handler para seleccionar un prospecto duplicado detectado automáticamente
  const handleDuplicateSelect = useCallback((dup: DuplicateProspect) => {
    setProspectoId(dup.id)

    // Cargar datos personales
    setDatosPersonales(prev => ({
      ...prev,
      nombre: dup.nombre_completo || "",
      paisOrigen: dup.pais_origen || dup.pais_nombre || "",
      paisResidencia: dup.pais_residencia || dup.pais_nombre || "",
      telefono: dup.telefono || "",
      dpi: dup.numero_identificacion || "",
      emailPersonal: dup.correo_electronico || "",
      emailCorporativo: dup.correo_corporativo || "",
      fechaNacimiento: dup.fecha_nacimiento
        ? new Date(dup.fecha_nacimiento).toISOString().split("T")[0]
        : "",
      direccion: dup.direccion_residencia || "",
    }))

    // Cargar datos laborales
    setDatosLaborales(prev => ({
      ...prev,
      empresa: dup.empresa_donde_labora_actualmente || "",
      puesto: dup.puesto || "",
      telefonoCorporativo: dup.telefono_corporativo || "",
      departamento: dup.departamento || "",
      direccionEmpresa: dup.direccion_empresa || "",
      sectorEmpresa: "",
    }))

    // Cargar datos académicos
    setDatosAcademicos(prev => ({
      ...prev,
      programa: dup.interes || "",
      ultimoTitulo: (dup.ultimo_titulo_obtenido as DatosAcademicos["ultimoTitulo"]) || "licenciatura",
      institucionAnterior: dup.institucion_titulo || "",
      añoGraduacion: dup.anio_graduacion?.toString() || "",
      modalidad: (dup.modalidad as "sincronica") || "sincronica",
      fechaInicioEspecifica: dup.fecha_inicio_especifica
        ? dup.fecha_inicio_especifica.split("T")[0] || dup.fecha_inicio_especifica.split(" ")[0]
        : "",
      fechaTallerInduccion: dup.fecha_taller_reduccion
        ? dup.fecha_taller_reduccion.split("T")[0] || dup.fecha_taller_reduccion.split(" ")[0]
        : "",
      fechaTallerIntegracion: dup.fecha_taller_integracion
        ? dup.fecha_taller_integracion.split("T")[0] || dup.fecha_taller_integracion.split(" ")[0]
        : "",
      medioConocio: (dup.medio_conocimiento_institucion as DatosAcademicos["medioConocio"]) || "",
      cursosAprobados: dup.cantidad_cursos_aprobados?.toString() || "",
      diaEstudio: (dup.dia_estudio as DatosAcademicos["diaEstudio"]) || "jueves",
      observaciones: dup.observaciones || "",
      titulo1: dup.interes || "",
      titulo1_duracion: "",
    }))

    // Cargar datos financieros si existen
    if (dup.monto_inscripcion || dup.metodo_pago || dup.convenio_pago_id) {
      setDatosFinancieros(prev => ({
        ...prev,
        inscripcion: dup.monto_inscripcion || prev.inscripcion,
        formaPago: (dup.metodo_pago as DatosFinancieros["formaPago"]) || prev.formaPago,
        convenioId: dup.convenio_pago_id || undefined,
        tieneConvenio: !!dup.convenio_pago_id,
      }))
    }

    // Notificar al usuario
    Swal.fire({
      icon: "success",
      title: "Prospecto reutilizado",
      html: `
        <p>Se cargaron los datos del prospecto existente:</p>
        <p class="mt-2 font-semibold">${dup.nombre_completo}</p>
        <p class="text-sm text-gray-600 mt-1">Coincidencia: ${dup.coincidencia}%</p>
        <p class="text-sm text-gray-500 mt-2">Todos los campos se han actualizado con la información registrada anteriormente.</p>
      `,
      confirmButtonText: "Continuar",
      confirmButtonColor: "#16a34a",
      timer: 4000,
      timerProgressBar: true,
    })
  }, [])

  const handleFinalizarInscripcion = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      // 1. Finalizar inscripción (crear prospecto y estudiante_programa)
      const response = await api.post(
        `/inscripciones/finalizar`,
        {
          personales: { ...datosPersonales, id: prospectoId },
          laborales: datosLaborales,
          academicos: datosAcademicos,
          financieros: datosFinancieros,
        }
      );

      const nuevoId = response.data.prospecto_id;
      const estudianteProgramas: any[] = response.data.programas || [];
      const advertencias = response.data.advertencias || [];
      const mensajeAdvertencia = response.data.mensaje_advertencia;

      setProspectoId(nuevoId);
      setEstudianteProgramaIds(estudianteProgramas.map((p: any) => p.id));

      // 2. Subida de documentos que NO se hayan subido ya durante la sesión
      // Los documentos se suben en tiempo real desde DocumentosTab.handleFileChange,
      // así que aquí solo subimos los que no se subieron aún (archivos sin prospectoId previo).
      // Si prospectoId existía antes (retroceso/reinscripción) los docs ya se subieron en real-time.
      if (!prospectoId) {
        // Solo si es prospecto NUEVO (sin ID previo) necesitamos subir los archivos aquí
        const docsToUpload = documentos.filter(
          (d) => d.archivos && d.archivos.length > 0 && d.id !== 'inscripcion'
        );
        for (const doc of docsToUpload) {
          for (const file of doc.archivos) {
            const formData = new FormData();
            formData.append("prospecto_id", nuevoId.toString());
            formData.append("tipo_documento", String(doc.id));
            formData.append("file", file);

            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            await axios.post(`${API_BASE_URL}/api/documentos`, formData, {
              headers: {
                "Content-Type": "multipart/form-data",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            });
          }
        }
      }

      // 🔥 3. Verificar si hay advertencias de boleta
      if (advertencias.length > 0) {
        // Construir HTML con los detalles de las advertencias
        const advertenciasHtml = advertencias.map((adv: any) => {
          let tipoMsg = '';
          if (adv.tipo === 'boleta_duplicada') {
            tipoMsg = '⚠️ Boleta duplicada';
          } else if (adv.tipo === 'error_bd') {
            tipoMsg = '❌ Error al registrar boleta';
          } else {
            tipoMsg = '⚠️ Problema con boleta';
          }
          return `<li><strong>${tipoMsg}:</strong> ${adv.mensaje}</li>`;
        }).join('');

        await Swal.fire({
          icon: 'warning',
          title: '⚠️ Inscripción con Advertencias',
          html: `
            <p class="mb-3">El expediente fue creado pero hay problemas con la boleta de inscripción:</p>
            <ul class="text-left text-sm space-y-2 bg-amber-50 p-3 rounded">
              ${advertenciasHtml}
            </ul>
            <div class="mt-4 p-3 bg-red-50 rounded text-sm text-red-800 text-left">
              <strong>⚠️ IMPORTANTE:</strong><br/>
              ${mensajeAdvertencia || 'Por favor revise y cargue una boleta de inscripción válida en la sección de documentos.'}
            </div>
            <div class="mt-3 text-sm text-gray-600">
              El prospecto quedó en estado <strong>"Preinscripción"</strong> hasta que se solucione el problema con la boleta.
            </div>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#f59e0b',
        });
      } else {
        // 4. Mostrar mensaje de éxito normal (sin advertencias)
        await Swal.fire({
          icon: 'success',
          title: '¡Expediente creado con éxito!',
          html: `
            <p>El estudiante pasó a la primera fase de aprobación correctamente.</p>
            <ul class="text-left text-sm mt-2 space-y-1">
              <li>✅ Programas asignados</li>
              <li>✅ Plan de pagos generado</li>
              <li>✅ Documentos cargados</li>
              <li>✅ Boleta de inscripción procesada</li>
            </ul>
          `,
          confirmButtonText: 'Entendido',
        });
      }

      // ✅ Borrar cache del borrador activo al completar inscripción
      if (activeDraftId) {
        deleteDraft(activeDraftId)
      }

      window.location.reload();

    } catch (error: any) {
      console.error("Error al finalizar inscripción:", error.response?.data || error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || "Ocurrió un error",
        icon: 'error',
      });
      setIsSubmitting(false)
    }
  };





  return (
    <div className="relative">
      {isSubmitting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Procesando...
        </div>
      )}
      {loadingProspectFromUrl && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando datos del prospecto...
        </div>
      )}
      <div className="container mx-auto max-w-6xl p-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-primary mb-2">Ficha de Inscripción</h1>
          <Progress value={progress} className="h-2 w-full" />
        </div>

        {/* ── Panel de Borradores ─────────────────────────────────────── */}
        <DraftManager
          drafts={drafts}
          activeDraftId={activeDraftId}
          maxDrafts={maxDrafts}
          synced={synced}
          onSave={handleSaveDraft}
          onLoad={handleLoadDraft}
          onDelete={handleDeleteDraft}
          onNewDraft={handleNewDraft}
        />

        <Card className="border-2 border-muted shadow-md">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={(v) => changeTab(v as TabId)}>
              <TabsList className="mb-6 grid w-full grid-cols-2 md:grid-cols-5 bg-muted/30">
                <TabsTrigger value="personal">Datos Personales</TabsTrigger>
                <TabsTrigger value="laboral">Datos Laborales</TabsTrigger>
                <TabsTrigger value="academico">Info. Académica</TabsTrigger>
                <TabsTrigger value="financiero">Datos Financieros</TabsTrigger>
                <TabsTrigger value="documentos">Documentos</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" forceMount className={activeTab !== "personal" ? "hidden" : ""}>
                <PersonalTab
                  datos={datosPersonales}
                  setDatos={setDatosPersonales}
                  openModal={() => setShowModal(true)}
                  goNext={() => changeTab("laboral")}
                  prospectoId={prospectoId}
                  onDuplicateSelect={handleDuplicateSelect}
                />
              </TabsContent>

              <TabsContent value="laboral" forceMount className={activeTab !== "laboral" ? "hidden" : ""}>
                <LaboralTab
                  datos={datosLaborales}
                  setDatos={setDatosLaborales}
                  goPrev={() => changeTab("personal")}
                  goNext={() => changeTab("academico")}
                />
              </TabsContent>

              <TabsContent value="academico" forceMount className={activeTab !== "academico" ? "hidden" : ""}>
                <AcademicoTab
                  datos={datosAcademicos}
                  setDatos={setDatosAcademicos}
                  goPrev={() => changeTab("laboral")}
                  goNext={() => changeTab("financiero")}
                />
              </TabsContent>

              <TabsContent value="financiero" forceMount className={activeTab !== "financiero" ? "hidden" : ""}>
                <FinancieroTab
                  datos={datosFinancieros}
                  setDatos={setDatosFinancieros}
                  goPrev={() => changeTab("academico")}
                  goNext={() => changeTab("documentos")}
                  programas={programasParaFinanciero}
                  studentName={datosPersonales.nombre}
                  nit={datosPersonales.dpi}
                  telefono={datosPersonales.telefono}
                  email={datosPersonales.emailPersonal}
                  programa={datosAcademicos.programa}
                  preserveFinancialFromProspect={preserveFinancialFromProspect}
                  onPreserveFinancialApplied={() => setPreserveFinancialFromProspect(false)}
                />
              </TabsContent>

              <TabsContent value="documentos" forceMount className={activeTab !== "documentos" ? "hidden" : ""}>
                <DocumentosTab
                  documentos={documentos}
                  setDocumentos={setDocumentos}
                  goPrev={() => changeTab("financiero")}
                  onFinalizar={handleFinalizarInscripcion}
                  isFinalizing={isSubmitting}
                  prospectoId={prospectoId as number}
                  montoInscripcion={parseFloat(datosFinancieros.inscripcion?.replace(/,/g, "") || "0")}
                  descuentoInscripcion={!!datosFinancieros.descuentoInscripcion}
                  studentName={datosPersonales.nombre}
                  studentPhone={datosPersonales.telefono}
                  studentEmail={datosPersonales.emailPersonal}
                  programa={datosAcademicos.programa}
                  inscripcion={datosFinancieros.inscripcion}
                  cuotaMensual={datosFinancieros.cuotaMensual}
                  cantidadMeses={datosFinancieros.cantidadMeses}
                  inversionTotal={datosFinancieros.inversionTotal}
                  formaPago={datosFinancieros.formaPago}
                  fechaInicioEspecifica={datosAcademicos.fechaInicioEspecifica}
                  diaEstudio={datosAcademicos.diaEstudio}
                  duracionCarrera={datosAcademicos.duracion}
                  titulo1={datosAcademicos.titulo1}
                  titulo2={datosAcademicos.titulo2}
                  titulo3={datosAcademicos.titulo3}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <ProspectSearchModal
          open={showModal}
          onOpenChange={setShowModal}
          onSelect={(p) => {
            setProspectoId(p.id)

            // Cargar datos personales
            setDatosPersonales(prev => ({
              ...prev,
              nombre: p.nombreCompleto,
              paisOrigen: p.paisOrigen || "",
              paisResidencia: p.paisResidencia || "",
              telefono: p.telefono,
              dpi: p.dpi || "",
              emailPersonal: p.emailPersonal,
              emailCorporativo: p.emailCorporativo || "",
              fechaNacimiento: p.fechaNacimiento ? new Date(p.fechaNacimiento).toISOString().split('T')[0] : "",
              direccion: p.direccion || "",
            }))

            // Cargar datos laborales
            setDatosLaborales(prev => ({
              ...prev,
              empresa: p.empresa || "",
              puesto: p.puesto || "",
              telefonoCorporativo: p.telefonoCorporativo || "",
              departamento: p.departamento || "",
              direccionEmpresa: p.direccionEmpresa || "",
              sectorEmpresa: "",
            }))

            // 🎓 Cargar datos académicos automáticamente
            setDatosAcademicos(prev => ({
              ...prev,
              programa: p.programaInteres || "",
              ultimoTitulo: (p.ultimoTitulo as DatosAcademicos["ultimoTitulo"]) || "licenciatura",
              institucionAnterior: p.institucionTitulo || "",
              añoGraduacion: p.anioGraduacion || "",
              modalidad: (p.modalidad as "sincronica") || "sincronica",
              fechaInicioEspecifica: p.fechaInicioEspecifica
                ? p.fechaInicioEspecifica.split("T")[0] || p.fechaInicioEspecifica.split(" ")[0]
                : "",
              fechaTallerInduccion: p.fechaTallerReduccion
                ? p.fechaTallerReduccion.split("T")[0] || p.fechaTallerReduccion.split(" ")[0]
                : "",
              fechaTallerIntegracion: p.fechaTallerIntegracion
                ? p.fechaTallerIntegracion.split("T")[0] || p.fechaTallerIntegracion.split(" ")[0]
                : "",
              medioConocio: (p.medioConocio ?? p.medioConocimiento ?? "") as DatosAcademicos["medioConocio"],
              cursosAprobados: p.cursosAprobados || "",
              diaEstudio: (p.diaEstudio as DatosAcademicos["diaEstudio"]) || "jueves",
              observaciones: p.observaciones || "",
              // Los programas se cargarán cuando se cargue la lista de programas disponibles
              titulo1: p.programaInteres || "",
              titulo1_duracion: "", // Se calculará automáticamente
            }))

            // 💰 Cargar datos financieros si existen
            if (p.montoInscripcion || p.metodoPago || p.convenioId) {
              setDatosFinancieros(prev => ({
                ...prev,
                inscripcion: p.montoInscripcion || prev.inscripcion,
                formaPago: (p.metodoPago as DatosFinancieros["formaPago"]) || prev.formaPago,
                convenioId: p.convenioId || undefined,
                tieneConvenio: !!p.convenioId,
              }))
            }

            setShowModal(false)
          }}
        />

      </div>
    </div>
  )
}
