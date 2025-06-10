"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
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

import axios from "axios"
import { API_BASE_URL } from "@/utils/apiConfig"

export default function RegistrationForm() {
  const [activeTab, setActiveTab] = useState<TabId>("personal")
  const [progress, setProgress] = useState(20)
  const [showModal, setShowModal] = useState(false)
  const [prospectoId, setProspectoId] = useState<number | null>(null)

  const [datosPersonales, setDatosPersonales] = useState<DatosPersonales>({
    nombre: "", paisOrigen: "", paisResidencia: "", telefono: "",
    dpi: "", emailPersonal: "", emailCorporativo: "",
    fechaNacimiento: "", direccion: ""
  })

  const [datosAcademicos, setDatosAcademicos] = useState<DatosAcademicos>({
    programa: "", duracion: "", ultimoTitulo: "licenciatura", modalidad: "sincronica",
    fechaInicio: "", diaEstudio: "jueves", fechaInicioEspecifica: "",
    fechaTallerInduccion: "", fechaTallerIntegracion: "", institucionAnterior: "",
    añoGraduacion: "", medioConocio: "redes", observaciones: "",
    cursosAprobados: "", titulo1: "", titulo1_duracion: "",
    titulo2: "", titulo2_duracion: "", titulo3: "", titulo3_duracion: "",
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

  const handleFinalizarInscripcion = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/inscripciones/finalizar`,
        {
          personales: { ...datosPersonales, id: prospectoId },
          laborales: datosLaborales,
          academicos: datosAcademicos,
          financieros: datosFinancieros,
        }
      );
  
      const nuevoId = response.data.prospecto_id;
      const estudianteProgramas: any[] = response.data.programas || [];
      setProspectoId(nuevoId);
  
      // Subida de documentos
      const docsToUpload = documentos.filter((d) => d.estado === "cargado" && d.archivo);
      for (const doc of docsToUpload) {
        const formData = new FormData();
        formData.append("prospecto_id", nuevoId.toString());
        formData.append("tipo_documento", doc.id);
        formData.append("file", doc.archivo!);
  
        await axios.post(`${API_BASE_URL}/api/documentos`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
  
      // Generar plan de pagos para cada programa
      for (const programa of estudianteProgramas) {
        await axios.post(`${API_BASE_URL}/api/plan-pagos/generar`, {
          estudiante_programa_id: programa.id,
        });
      }
  
      // Mostrar SweetAlert y recargar al confirmar
      Swal.fire({
        title: '¡Inscripción completada!',
        text: 'El estudiante fue inscrito correctamente y se generó el plan de pagos. Se enviarán las aprobaciones correspondientes.',
        icon: 'success',
        confirmButtonText: 'Aceptar',
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.reload();
        }
      });
  
    } catch (error: any) {
      console.error("Error al finalizar inscripción:", error.response?.data || error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || "Ocurrió un error",
        icon: 'error',
      });
    }
  };
  
  

  return (
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
                convenioId={datosFinancieros.convenioId}
              />
            </TabsContent>

            <TabsContent value="documentos">
              <DocumentosTab
                documentos={documentos}
                setDocumentos={setDocumentos}
                goPrev={() => changeTab("financiero")}
                onFinalizar={handleFinalizarInscripcion}
                prospectoId={prospectoId as number}
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
          setDatosPersonales(prev => ({
            ...prev,
            nombre: p.nombreCompleto,
            paisOrigen: p.paisOrigen,
            paisResidencia: p.paisResidencia,
            telefono: p.telefono,
            dpi: p.dpi,
            emailPersonal: p.emailPersonal,
            emailCorporativo: p.emailCorporativo,
            fechaNacimiento: p.fechaNacimiento,
          }))

          setDatosLaborales(prev => ({
            ...prev,
            empresa: p.empresa,
            puesto: p.puesto,
            telefonoCorporativo: p.telefonoCorporativo,
            departamento: p.departamento,
            sectorEmpresa: "",
            direccionEmpresa: "",
          }))

          setShowModal(false)
        }}
      />
    </div>
  )
}
