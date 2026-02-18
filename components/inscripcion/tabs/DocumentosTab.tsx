"use client"
import React, { useEffect, useState, useRef, useMemo, Dispatch, SetStateAction } from "react"
import axios, { AxiosError } from "axios"
import { API_BASE_URL } from "@/utils/apiConfig"
import { ArrowLeft, ArrowRight, FileText, Info, Upload, X, CheckCircle, Loader2, Eye, MessageSquare, ExternalLink, Trash2, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import WhatsAppMensajeGenerator from "../WhatsAppMensajeGenerator"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FilePreviewModal } from "@/components/ui/file-preview-modal"
import BoletaInscripcionUpload from "./BoletaInscripcionUpload"

export interface Documento {
  id: string
  nombre: string
  descripcion: string
  estado: "pendiente" | "cargado"
  archivos: File[]
  optional?: boolean
}

/** Documento que ya existe en el servidor */
interface ServerDoc {
  id: number
  tipo_documento: string
  ruta_archivo: string
  url: string
  estado: string
  subida_at: string
  fileName: string
}

export const DOCUMENTOS_DEFAULT: Documento[] = [
  { id: "dpi", nombre: "DPI (ambos lados)", descripcion: "Documento de identificación personal, ambos lados en un solo archivo.", estado: "pendiente", archivos: [] },
  { id: "recibo", nombre: "Recibo de luz o teléfono", descripcion: "Comprobante de domicilio reciente (no mayor a 3 meses).", estado: "pendiente", archivos: [] },
  { id: "american", nombre: "Recibo de Gaia", descripcion: "Comprobante de pago emitido por Gaia BS.", estado: "pendiente", archivos: [] },
  { id: "inscripcion", nombre: "Boleta de inscripción", descripcion: "Comprobante de pago de la cuota de inscripción. DEBE SUBIRSE ANTES DE FINALIZAR.", estado: "pendiente", archivos: [] }, // 🔥 OBLIGATORIA
  { id: "titulo", nombre: "Título o diploma", descripcion: "Copia de su último título académico obtenido.", estado: "pendiente", archivos: [], optional: true },
  { id: "foto", nombre: "Fotografía reciente", descripcion: "Fotografía tamaño carné con fondo blanco.", estado: "pendiente", archivos: [], optional: true },
  { id: "cierrePensum", nombre: "Cierre de pensum", descripcion: "Copia del cierre de pensum emitido por la universidad.", estado: "pendiente", archivos: [], optional: true },
  { id: "certificacionCursos", nombre: "Certificación de cursos aprobados", descripcion: "Certificación oficial con la cantidad de cursos aprobados.", estado: "pendiente", archivos: [], optional: true },
  { id: "otros", nombre: "Otros documentos (PDF)", descripcion: "Documento PDF con información adicional.", estado: "pendiente", archivos: [], optional: true },
  { id: "carnetColaborador", nombre: "Carnet de Colaborador", descripcion: "Carnet de identificación de colaborador institucional.", estado: "pendiente", archivos: [], optional: true },
  { id: "autorizacionAcademica", nombre: "Autorización Académica", descripcion: "Autorización firmada por la dirección académica.", estado: "pendiente", archivos: [], optional: true },
  { id: "autorizacionFinanciera", nombre: "Autorización Financiera", descripcion: "Autorización firmada por el área financiera.", estado: "pendiente", archivos: [], optional: true },
  { id: "autorizacionAsociaciones", nombre: "Autorización Asociaciones", descripcion: "Autorización de asociaciones o convenios institucionales.", estado: "pendiente", archivos: [], optional: true },
  { id: "valeDescuento", nombre: "Vale de Descuento", descripcion: "Comprobante de vale de descuento autorizado.", estado: "pendiente", archivos: [], optional: true },
  { id: "mensajeFinal", nombre: "Mensaje Final", descripcion: "Documento con el mensaje final enviado al estudiante.", estado: "pendiente", archivos: [], optional: true },
]

type Props = {
  documentos: Documento[]
  setDocumentos: Dispatch<SetStateAction<Documento[]>>
  goPrev: () => void
  prospectoId: number
  onFinalizar?: () => Promise<void>
  isFinalizing?: boolean
  montoInscripcion?: number
  estudianteProgramaId?: number
  studentName?: string
  studentPhone?: string
  studentEmail?: string
  programa?: string
  asesor?: string
  // Datos financieros para mensaje
  inscripcion?: string
  cuotaMensual?: string
  cantidadMeses?: string
  inversionTotal?: string
  serviciosElectronicos?: string
  formaPago?: string
  // Datos académicos para mensaje
  fechaInicioEspecifica?: string
  diaEstudio?: string
  duracionCarrera?: string
  titulo1?: string
  titulo2?: string
  titulo3?: string
}

export default function DocumentosTab({
  documentos,
  setDocumentos,
  goPrev,
  prospectoId,
  onFinalizar,
  isFinalizing,
  montoInscripcion = 1000,
  estudianteProgramaId,
  studentName = "",
  studentPhone = "",
  studentEmail = "",
  programa = "",
  asesor = "",
  inscripcion = "",
  cuotaMensual = "",
  cantidadMeses = "",
  inversionTotal = "",
  serviciosElectronicos = "",
  formaPago = "",
  fechaInicioEspecifica = "",
  diaEstudio = "",
  duracionCarrera = "",
  titulo1 = "",
  titulo2 = "",
  titulo3 = "",
}: Props) {
  const hiddenInput = useRef<HTMLInputElement>(null)
  const uploadTarget = useRef<string | null>(null)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  // Nombres de archivos ya subidos en el servidor (por tipo_documento)
  const [serverFileNames, setServerFileNames] = useState<Record<string, string[]>>({})
  // Documentos existentes en el servidor agrupados por tipo
  const [serverDocsByType, setServerDocsByType] = useState<Record<string, ServerDoc[]>>({})
  const [loadingServerDocs, setLoadingServerDocs] = useState(false)
  const docsLoadedRef = useRef(false)

  // Cargar documentos existentes del servidor al montar (o cuando cambia prospectoId)
  useEffect(() => {
    if (!prospectoId || docsLoadedRef.current) return
    docsLoadedRef.current = true
    setLoadingServerDocs(true)
    ;(async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await axios.get(
          `${API_BASE_URL}/api/documentos/prospecto/${prospectoId}?latest_iteration=1`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        )
        const serverDocs: any[] = Array.isArray(res.data) ? res.data : []
        if (serverDocs.length === 0) return

        // Construir mapa de nombres ya subidos por tipo
        const namesMap: Record<string, string[]> = {}
        const docsMap: Record<string, ServerDoc[]> = {}

        for (const sd of serverDocs) {
          const tipo = (sd.tipo_documento || "").trim().toLowerCase()
          const fileName = (sd.ruta_archivo || "").split("/").pop() || ""
          const backendOrigin = API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "")
          const docUrl = sd.url
            ? (sd.url.startsWith("http") ? sd.url : `${backendOrigin}${sd.url}`)
            : `${backendOrigin}/storage/${sd.ruta_archivo}`

          if (!namesMap[tipo]) namesMap[tipo] = []
          if (fileName) namesMap[tipo].push(fileName)

          if (!docsMap[tipo]) docsMap[tipo] = []
          docsMap[tipo].push({
            id: sd.id,
            tipo_documento: sd.tipo_documento,
            ruta_archivo: sd.ruta_archivo,
            url: docUrl,
            estado: sd.estado || "pendiente",
            subida_at: sd.subida_at || sd.created_at || "",
            fileName,
          })
        }
        setServerFileNames(namesMap)
        setServerDocsByType(docsMap)

        // Marcar los documentos que ya están en el servidor como "cargado"
        setDocumentos(prev =>
          prev.map(doc => {
            const tipoKey = doc.id.trim().toLowerCase()
            const existeEnServer = tipoKey in docsMap
            if (existeEnServer && doc.estado === "pendiente") {
              return { ...doc, estado: "cargado" as const }
            }
            return doc
          })
        )
      } catch (err) {
        console.error("Error precargando documentos existentes:", err)
      } finally {
        setLoadingServerDocs(false)
      }
    })()
  }, [prospectoId])

  const triggerUpload = (id: string) => {
    if (!hiddenInput.current) return
    hiddenInput.current.value = ""
    uploadTarget.current = id
    hiddenInput.current.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0 || !uploadTarget.current) return

    const tipoKey = uploadTarget.current.trim().toLowerCase()

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert("El archivo excede 5 MB.")
        continue
      }

      const okTypes = ["application/pdf", "image/jpeg", "image/png"]
      if (!okTypes.includes(file.type)) {
        alert("Sólo se permiten archivos PDF, JPG o PNG.")
        continue
      }

      // 🔥 Si el archivo ya existe en el servidor con el mismo nombre, no re-subir
      const existingNames = serverFileNames[tipoKey] || []
      if (existingNames.some(name => name === file.name)) {
        // Marcar como cargado localmente sin re-subir
        setDocumentos(docs =>
          docs.map(d =>
            d.id === uploadTarget.current
              ? { ...d, archivos: [...d.archivos, file], estado: "cargado" }
              : d
          )
        )
        continue
      }

      const formData = new FormData()
      formData.append("prospecto_id", String(prospectoId))
      formData.append("tipo_documento", uploadTarget.current)
      formData.append("file", file)

      try {
        await axios.post(`${API_BASE_URL}/api/documentos`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        // Registrar el nombre subido para evitar duplicados futuros
        setServerFileNames(prev => ({
          ...prev,
          [tipoKey]: [...(prev[tipoKey] || []), file.name],
        }))
        setDocumentos(docs =>
          docs.map(d =>
            d.id === uploadTarget.current
              ? { ...d, archivos: [...d.archivos, file], estado: "cargado" }
              : d
          )
        )
      } catch (err) {
        console.error(err)
        alert("Error al subir el archivo. Inténtalo de nuevo.")
      }
    }
  }

  const handlePreviewFile = (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
      setPreviewFile(file)
      setShowPreview(true)
    }
    reader.readAsDataURL(file)
  }

  const removeFile = (id: string, index: number) =>
    setDocumentos(docs =>
      docs.map(d => {
        if (d.id !== id) return d
        const nuevos = d.archivos.filter((_, i) => i !== index)
        return {
          ...d,
          archivos: nuevos,
          estado: nuevos.length > 0 ? "cargado" : "pendiente",
        }
      })
    )

  // Descartar un documento que ya existe en el servidor
  const handleDiscardServerDoc = async (tipoKey: string, serverDoc: ServerDoc) => {
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`${API_BASE_URL}/api/documentos/${serverDoc.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      // Quitar del mapa de docs del servidor
      setServerDocsByType(prev => {
        const updated = { ...prev }
        updated[tipoKey] = (updated[tipoKey] || []).filter(d => d.id !== serverDoc.id)
        if (updated[tipoKey].length === 0) delete updated[tipoKey]
        return updated
      })

      // Quitar del mapa de nombres
      setServerFileNames(prev => {
        const updated = { ...prev }
        updated[tipoKey] = (updated[tipoKey] || []).filter(n => n !== serverDoc.fileName)
        if (updated[tipoKey]?.length === 0) delete updated[tipoKey]
        return updated
      })

      // Si ya no queda nada (ni local ni servidor), poner pendiente
      setDocumentos(docs =>
        docs.map(d => {
          if (d.id.trim().toLowerCase() !== tipoKey) return d
          const serverRemaining = (serverDocsByType[tipoKey] || []).filter(sd => sd.id !== serverDoc.id)
          if (serverRemaining.length === 0 && d.archivos.length === 0) {
            return { ...d, estado: "pendiente" as const }
          }
          return d
        })
      )
    } catch (err) {
      console.error("Error al descartar documento:", err)
      alert("No se pudo eliminar el documento del servidor.")
    }
  }

  // Previsualizar un doc del servidor en nueva pestaña
  const handlePreviewServerDoc = (doc: ServerDoc) => {
    window.open(doc.url, "_blank", "noopener,noreferrer")
  }

  // Memoized validity: true when no required docs are pending
  // Considers both local files and server docs
  const isFormValid = useMemo(() => {
    return !documentos.some(d => {
      if (d.optional) return false
      const tipoKey = d.id.trim().toLowerCase()
      const hasServerDocs = (serverDocsByType[tipoKey] || []).length > 0
      return d.estado === "pendiente" && !hasServerDocs
    })
  }, [documentos, serverDocsByType])

  return (
    <>
      <Alert className="border-blue-200 bg-blue-50 text-blue-800">
        <Info className="h-4 w-4" />
        <AlertTitle>Importante</AlertTitle>
        <AlertDescription>
          Todos los documentos deben ser PDF, JPG o PNG, y pesar máximo 5MB.
        </AlertDescription>
      </Alert>

      {/* Success banner when all required docs uploaded */}
      {isFormValid && (
        <div className="mt-4 mb-6 flex items-center gap-2 rounded bg-green-100 px-4 py-2 text-green-800">
          <CheckCircle className="h-5 w-5" />
          Documentos obligatorios cargados
        </div>
      )}

      <section className="space-y-6">
        <h3 className="text-lg font-semibold text-blue-900">Documentos obligatorios</h3>
        
        {/* Componente expandido para Boleta de Inscripción - SIN CARD */}
        <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50/30">
          <BoletaInscripcionUpload
            prospectoId={prospectoId}
            estudianteProgramaId={estudianteProgramaId}
            montoInscripcion={montoInscripcion}
            onBoletaSubida={() => {
              // Marcar documento de inscripción como cargado
              setDocumentos(docs =>
                docs.map(d =>
                  d.id === "inscripcion"
                    ? { ...d, estado: "cargado" as const }
                    : d
                )
              )
            }}
          />
        </div>

        {/* Resto de documentos */}
        <div className="grid gap-4 md:grid-cols-2">
          {documentos.filter(doc => doc.id !== "inscripcion").map(doc => {
            const tipoKey = doc.id.trim().toLowerCase()
            const docsEnServidor = serverDocsByType[tipoKey] || []

            return (
            <article
              key={doc.id}
              className="rounded-lg border p-4 transition-all hover:border-blue-200 hover:bg-blue-50/30"
            >
              <header className="mb-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">{doc.nombre}</h4>
                  {doc.optional && (
                    <Badge variant="secondary" className="text-xs">Opcional</Badge>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={
                    doc.estado === "cargado"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {doc.estado === "cargado" ? "Cargado" : "Pendiente"}
                </Badge>
              </header>

              <p className="mb-4 text-sm text-gray-600">{doc.descripcion}</p>

              {/* Documentos ya existentes en el servidor */}
              {docsEnServidor.length > 0 && (
                <div className="space-y-2 mb-3">
                  <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Ya subido anteriormente
                  </p>
                  {docsEnServidor.map(sd => (
                    <div
                      key={sd.id}
                      className="flex items-center justify-between p-2 rounded-lg border border-green-200 bg-green-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate font-medium" title={sd.fileName}>
                            {sd.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Subido: {sd.subida_at ? new Date(sd.subida_at).toLocaleDateString("es-GT") : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                          onClick={() => handlePreviewServerDoc(sd)}
                          title="Ver documento"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDiscardServerDoc(tipoKey, sd)}
                          title="Descartar documento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Archivos locales nuevos (subidos en esta sesión) */}
              {doc.archivos.length > 0 && (
                <div className="space-y-2">
                  {doc.archivos.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-sm truncate font-medium"
                            title={f.name}
                          >
                            {f.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(f.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handlePreviewFile(f)}
                          title="Vista previa"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => removeFile(doc.id, idx)}
                          title="Eliminar"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Botón para subir */}
              <div className="mt-2">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => triggerUpload(doc.id)}
                >
                  <Upload className="h-4 w-4" />
                  {docsEnServidor.length > 0 || doc.archivos.length > 0
                    ? "Reemplazar / Agregar archivo"
                    : "Subir archivo"}
                </Button>
              </div>
            </article>
            )
          })}
        </div>
      </section>

      <input
        ref={hiddenInput}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        multiple
        onChange={handleFileChange}
      />

      <ExtraRequirements />

      {/* Enviar Mensaje WhatsApp */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-green-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Mensaje Final al Estudiante
            </h3>
            <p className="text-sm text-green-700">Generar y enviar mensaje de bienvenida o confirmación por WhatsApp</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowWhatsApp(true)}
            className="border-green-400 text-green-800 hover:bg-green-100"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Generar Mensaje
          </Button>
        </div>
      </div>

      <WhatsAppMensajeGenerator
        open={showWhatsApp}
        onOpenChange={setShowWhatsApp}
        studentName={studentName}
        studentPhone={studentPhone}
        studentEmail={studentEmail}
        programa={programa}
        asesor={asesor}
        inscripcion={inscripcion}
        cuotaMensual={cuotaMensual}
        cantidadMeses={cantidadMeses}
        inversionTotal={inversionTotal}
        serviciosElectronicos={serviciosElectronicos}
        formaPago={formaPago}
        fechaInicioEspecifica={fechaInicioEspecifica}
        diaEstudio={diaEstudio}
        duracionCarrera={duracionCarrera}
        titulo1={titulo1}
        titulo2={titulo2}
        titulo3={titulo3}
      />

      <div className="mt-6 flex flex-col-reverse space-y-4 space-y-reverse sm:flex-row sm:space-y-0 sm:space-x-4">
        <Button
          variant="outline"
          className="w-full sm:w-auto gap-2"
          onClick={goPrev}
        >
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>

        {onFinalizar ? (
          <Button
            disabled={!isFormValid || isFinalizing}
            onClick={onFinalizar}
            className={isFormValid ? "bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto" : "w-full sm:w-auto"}
          >
            {isFinalizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizando...
              </>
            ) : (
              <>Finalizar inscripción <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        ) : (
          <Link href="/inscripcion/revision" className="w-full sm:w-auto">
            <Button
              disabled={!isFormValid}
              className={isFormValid ? "bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto" : "w-full sm:w-auto"}
            >
              Guardar y continuar <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Modal de Vista Previa */}
      <FilePreviewModal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false)
          setPreviewFile(null)
          setPreviewUrl(null)
        }}
        file={previewFile}
        previewUrl={previewUrl}
      />
    </>
  )
}

function ExtraRequirements() {
  return (
    <div className="mt-6 space-y-6 rounded-lg bg-blue-50 p-4">
      <h3 className="font-semibold text-blue-900">
        Documentos adicionales requeridos para los distintos programas de ASM
      </h3>

      <ScrollArea className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Programa</th>
              <th className="py-2 text-left">Título de diversificado</th>
              <th className="py-2 text-left">Cierre de pensum</th>
              <th className="py-2 text-left">Certificación de cursos aprobados</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["BBA 8", "Sí", "", "40"],
              ["BBA 12", "Sí", "", "30"],
              ["BBA 18", "Sí", "", "25"],
              ["BBA 24", "Sí", "", "20"],
              ["BBA 32", "Sí", "", "Menos de 20"],
            ].map(r => (
              <tr key={r[0]} className="border-b">
                {r.map((c, i) => (
                  <td key={i} className="py-2">{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  )
}
