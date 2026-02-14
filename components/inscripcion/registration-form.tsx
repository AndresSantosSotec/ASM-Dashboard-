"use client"

import { useState, useCallback } from "react"
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
import type { ProgramaConDuracion } from "./types"
import type { DuplicateProspect } from "@/hooks/useDuplicateProspectCheck"

import axios from "axios"
import { api } from "@/services/api"
import { API_BASE_URL } from "@/utils/apiConfig"
export default function RegistrationForm() {
  const [activeTab, setActiveTab] = useState<TabId>("personal")
  const [progress, setProgress] = useState(20)
  const [showModal, setShowModal] = useState(false)
  const [prospectoId, setProspectoId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [estudianteProgramaIds, setEstudianteProgramaIds] = useState<number[]>([])

  const [datosPersonales, setDatosPersonales] = useState<DatosPersonales>({
    nombre: "", paisOrigen: "", paisResidencia: "", telefono: "",
    dpi: "", emailPersonal: "", emailCorporativo: "",
    fechaNacimiento: "", direccion: "", esReinscripcion: false
  })

  const [datosAcademicos, setDatosAcademicos] = useState<DatosAcademicos>({
    programa: "", duracion: "", ultimoTitulo: "licenciatura", modalidad: "sincronica",
    fechaInicio: "", diaEstudio: "jueves", fechaInicioEspecifica: "",
    fechaTallerInduccion: "", fechaTallerIntegracion: "", institucionAnterior: "",
    añoGraduacion: "", medioConocio: "redes", observaciones: "",
    cursosAprobados: "", titulo1: "", titulo1_duracion: "",
    titulo2: "", titulo2_duracion: "", titulo3: "", titulo3_duracion: "",
    carrera: "",
  })

  const programasParaFinanciero: ProgramaConDuracion[] = [
    { programaId: Number(datosAcademicos.titulo1), duracion: Number(datosAcademicos.titulo1_duracion) },
    { programaId: Number(datosAcademicos.titulo2), duracion: Number(datosAcademicos.titulo2_duracion) },
    { programaId: Number(datosAcademicos.titulo3), duracion: Number(datosAcademicos.titulo3_duracion) },
  ].filter(p => p.programaId > 0 && p.duracion > 0)

  const [datosLaborales, setDatosLaborales] = useState<DatosLaborales>({
    empresa: "", puesto: "", telefonoCorporativo: "", departamento: "",
    sectorEmpresa: "", direccionEmpresa: ""
  })

  const [datosFinancieros, setDatosFinancieros] = useState<DatosFinancieros>({
    inscripcion: "1,000.00", cuotaMensual: "1,400.00", cantidadMeses: "18",
    inversionTotal: "26,200.00", formaPago: "debito", referencia: "",
    aceptaTerminos: false, tieneConvenio: false
  })

  const [documentos, setDocumentos] = useState<Documento[]>(DOCUMENTOS_DEFAULT)

  const changeTab = (tab: TabId) => {
    setActiveTab(tab)
    setProgress(tab === "personal" ? 20 : tab === "laboral" ? 40 : tab === "academico" ? 60 : tab === "financiero" ? 80 : 100)
  }

  // 🔍 Handler para seleccionar un prospecto duplicado detectado automáticamente
  const handleDuplicateSelect = useCallback((dup: DuplicateProspect) => {
    setProspectoId(dup.id)

    // Cargar datos personales
    setDatosPersonales(prev => ({
      ...prev,
      nombre: dup.nombre_completo || "",
      paisOrigen: dup.pais_origen || "",
      paisResidencia: dup.pais_residencia || "",
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
      medioConocio: (dup.medio_conocimiento_institucion as DatosAcademicos["medioConocio"]) || "redes",
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

            await axios.post(`${API_BASE_URL}/api/documentos`, formData, {
              headers: { "Content-Type": "multipart/form-data" },
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
      <div className="container mx-auto max-w-6xl p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Ficha de Inscripción</h1>
          <Progress value={progress} className="h-2 w-full" />
        </div>

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

            <TabsContent value="personal">
              <PersonalTab
                datos={datosPersonales}
                setDatos={setDatosPersonales}
                openModal={() => setShowModal(true)}
                goNext={() => changeTab("laboral")}
                prospectoId={prospectoId}
                onDuplicateSelect={handleDuplicateSelect}
              />
            </TabsContent>

            <TabsContent value="laboral">
              <LaboralTab
                datos={datosLaborales}
                setDatos={setDatosLaborales}
                goPrev={() => changeTab("personal")}
                goNext={() => changeTab("academico")}
              />
            </TabsContent>

            <TabsContent value="academico">
              <AcademicoTab
                datos={datosAcademicos}
                setDatos={setDatosAcademicos}
                goPrev={() => changeTab("laboral")}
                goNext={() => changeTab("financiero")}
              />
            </TabsContent>

            <TabsContent value="financiero">
              <FinancieroTab
                datos={datosFinancieros}
                setDatos={setDatosFinancieros}
                goPrev={() => changeTab("academico")}
                goNext={() => changeTab("documentos")}
                programas={programasParaFinanciero}
                studentName={datosPersonales.nombre}
                telefono={datosPersonales.telefono}
                email={datosPersonales.emailPersonal}
                programa={datosAcademicos.programa}
              />
            </TabsContent>

            <TabsContent value="documentos">
              <DocumentosTab
                documentos={documentos}
                setDocumentos={setDocumentos}
                goPrev={() => changeTab("financiero")}
                onFinalizar={handleFinalizarInscripcion}
                isFinalizing={isSubmitting}
                prospectoId={prospectoId as number}
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
            medioConocio: (p.medioConocimiento as DatosAcademicos["medioConocio"]) || "redes",
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
