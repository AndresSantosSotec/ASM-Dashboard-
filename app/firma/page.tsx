"use client"

import React, { useState, useEffect, useMemo } from "react"
import { fuzzyMatch } from "@/lib/search"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { API_BASE_URL } from "@/utils/apiConfig"
import { Input } from "@/components/ui/input"
import {
  Search,
  Filter,
  FileText,
  XCircle,
  Download,
  LayoutGrid,
  TableIcon,
  Loader2,
  AlertCircle,
} from "lucide-react"
import Swal from "sweetalert2"
import ContratoVistaModal from "@/components/firma/ContratoVistaModal"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"

interface ContactoEnviado {
  id: number
  prospecto_id: number
  fecha_envio: string
  resultado: string
  estado_firma?: string
  fecha_firma_estudiante?: string
  prospecto: { nombre_completo: string | null }
}

interface Prospecto {
  id: number
  nombre_completo: string | null
  correo_electronico: string | null
  status: string
}

interface Documento {
  id: number
  prospecto_id: number
  tipo_documento: string
}

export default function FirmaPage() {
  const router = useRouter()
  const [enviadosHoy, setEnviadosHoy] = useState<ContactoEnviado[]>([])
  const [contratoSeleccionado, setContratoSeleccionado] = useState<number | null>(null)
  const [modalVistaOpen, setModalVistaOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const itemsPerPage = 9

  useEffect(() => {
    const token = localStorage.getItem("token") || ""
    const controller = new AbortController()
    // Fallback: si el backend no responde en 20s, cancelar y mostrar error
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    setIsLoading(true)
    setLoadError(null)

    fetch(`${API_BASE_URL}/api/contactos-enviados`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: unknown) => {
        const arr: ContactoEnviado[] = Array.isArray(data) ? data : []
        // Filtrar items malformados (sin prospecto) para evitar crashes en el render
        const safe = arr.filter((e) => e && typeof e === "object" && e.prospecto)
        console.log("Contratos recibidos del backend:", arr.length, "válidos:", safe.length)
        setEnviadosHoy(safe)
      })
      .catch((err) => {
        if (err?.name === "AbortError") {
          setLoadError("La carga tardó demasiado. Verifica tu conexión e inténtalo de nuevo.")
        } else {
          console.error("Error cargando envíos:", err)
          setLoadError(err?.message || "No se pudieron cargar los contratos.")
        }
      })
      .finally(() => {
        clearTimeout(timeoutId)
        setIsLoading(false)
      })

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [reloadKey])

  const handleReload = () => setReloadKey((k) => k + 1)

  const handleDiscard = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Descartar contrato?',
      text: "Se eliminará el contrato y sus firmas asociadas. Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, descartar',
      cancelButtonText: 'Cancelar'
    })

    if (!result.isConfirmed) return

    const token = localStorage.getItem("token") || ""
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/contactos-enviados/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      )
      
      if (res.status === 422) {
        const errorData = await res.json()
        await Swal.fire({
          icon: 'warning',
          title: 'No se puede eliminar',
          text: errorData.error || 'Este contrato no tiene firmas asociadas',
          confirmButtonText: 'Entendido'
        })
        return
      }
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      
      setEnviadosHoy((prev) => prev.filter((env) => env.id !== id))
      
      // Cerrar modal si está abierto
      if (contratoSeleccionado === id) {
        setModalVistaOpen(false)
        setContratoSeleccionado(null)
      }
      
      await Swal.fire({
        icon: 'success',
        title: 'Contrato descartado',
        text: 'El contrato ha sido eliminado correctamente',
        timer: 2000,
        showConfirmButton: false
      })
    } catch (err: any) {
      console.error("Error al descartar:", err)
      Swal.fire("Error", "No se pudo descartar el contrato.", "error")
    }
  }

  const handleDescargarContrato = async (id: number, nombreEstudiante: string) => {
    const token = localStorage.getItem("token") || ""
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/contactos-enviados/${id}/download-contrato`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/pdf",
          },
        }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Contrato_${nombreEstudiante.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      await Swal.fire({
        icon: 'success',
        title: 'Descarga iniciada',
        text: 'El contrato se está descargando',
        timer: 1500,
        showConfirmButton: false
      })
    } catch (err: any) {
      console.error("Error al descargar:", err)
      Swal.fire("Error", "No se pudo descargar el contrato.", "error")
    }
  }

  // Filter and pagination logic
  const getFilteredData = (data: ContactoEnviado[], filter: 'todos' | 'pendientes' | 'completados') => {
    let filtered = data
    
    // Apply tab filter
    if (filter === 'pendientes') {
      filtered = filtered.filter(e => e.estado_firma === 'firmado_asesor')
    } else if (filter === 'completados') {
      filtered = filtered.filter(e => e.estado_firma === 'firmado_completo')
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(e =>
        fuzzyMatch(e.prospecto.nombre_completo ?? '', searchTerm)
      )
    }
    
    return filtered
  }

  const getPaginatedData = (data: ContactoEnviado[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return data.slice(startIndex, startIndex + itemsPerPage)
  }

  const getEstado = (env: ContactoEnviado) => {
    if (env.estado_firma === 'firmado_completo') {
      return { texto: 'Completado', color: 'bg-green-100 text-green-700 border-green-300' }
    }
    if (env.estado_firma === 'firmado_asesor') {
      return { texto: 'Pendiente Firma Estudiante', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' }
    }
    return { texto: 'Pendiente', color: 'bg-gray-100 text-gray-700 border-gray-300' }
  }

  const safeTime = (value?: string | null) => {
    if (!value) return null
    const d = new Date(value)
    if (isNaN(d.getTime())) return null
    return d.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })
  }
  const safeDate = (value?: string | null) => {
    if (!value) return null
    const d = new Date(value)
    if (isNaN(d.getTime())) return null
    return d.toLocaleDateString("es-GT", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    })
  }

  const renderCard = (env: ContactoEnviado) => {
    const estado = getEstado(env)
    const nombre = env.prospecto?.nombre_completo || 'Sin nombre'
    const horaEnvio = safeTime(env.fecha_envio)
    const horaFirma = safeTime(env.fecha_firma_estudiante)

    return (
      <Card key={env.id}>
        <CardHeader className="p-4 flex flex-wrap gap-2 justify-between items-start sm:items-center">
          <div>
            <CardTitle className="text-base">
              {nombre}
            </CardTitle>
            <CardDescription>
              Enviado: {horaEnvio ?? '—'}
              {horaFirma && (
                <>
                  {" | "}Firmado: {horaFirma}
                </>
              )}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={estado.color}
          >
            {estado.texto}
          </Badge>
        </CardHeader>

        <CardContent className="p-4 pt-2 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-700" />
              Contrato de Confidencialidad
            </span>
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                setContratoSeleccionado(env.id)
                setModalVistaOpen(true)
              }}
            >
              Ver Contrato
            </Button>
            <Button 
              variant="outline"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => handleDescargarContrato(env.id, nombre)}
            >
              <Download className="h-4 w-4 mr-1" /> Descargar PDF
            </Button>
            <Button 
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleDiscard(env.id)}
            >
              <XCircle className="h-4 w-4 mr-1" /> Descartar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderTableView = (data: ContactoEnviado[]) => {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Envío</TableHead>
              <TableHead>Fecha Firma</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No hay contratos.
                </TableCell>
              </TableRow>
            ) : (
              data.map(env => {
                const estado = getEstado(env)
                const nombre = env.prospecto?.nombre_completo || 'Sin nombre'
                return (
                  <TableRow key={env.id}>
                    <TableCell className="font-medium">
                      {nombre}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={estado.color}>
                        {estado.texto}
                      </Badge>
                    </TableCell>
                    <TableCell>{safeDate(env.fecha_envio) ?? '—'}</TableCell>
                    <TableCell>
                      {safeDate(env.fecha_firma_estudiante) ?? (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setContratoSeleccionado(env.id)
                            setModalVistaOpen(true)
                          }}
                        >
                          Ver
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleDescargarContrato(env.id, nombre)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDiscard(env.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Verificación de Firma Digital y Contrato" />
      <main className="flex-1 p-4 md:p-6">
        {/* Tarjeta informativa del sistema de firmas */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Sistema de Firmas Electrónicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">

              <div className="bg-white p-3 rounded-lg border">
                <h4 className="font-semibold text-blue-900 mb-2">✍️ Proceso de Firma</h4>
                <p className="text-gray-700">
                  1. Asesor firma → 2. Se envía email → 3. Estudiante firma mediante link único
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <h4 className="font-semibold text-blue-900 mb-2">👁️ Visualización</h4>
                {/* <p className="text-gray-700">
                  Haz clic en "Ver Todos los Contratos" para consultar contratos con ambas firmas guardadas.
                </p> */}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Contratos y Firmas</CardTitle>
                <CardDescription>
                  Verifica la firma digital y el contrato
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button 
                  variant="default"
                  onClick={() => router.push('/firma/contratos')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Todos los Contratos
                </Button>
                
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setViewMode('cards')
                      setCurrentPage(1)
                    }}
                    className="h-8"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setViewMode('table')
                      setCurrentPage(1)
                    }}
                    className="h-8"
                  >
                    <TableIcon className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar..."
                    className="pl-8 w-[200px]"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
                <p className="text-sm text-muted-foreground">Cargando contratos…</p>
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <AlertCircle className="h-10 w-10 text-red-500" />
                <p className="text-sm text-red-700 text-center max-w-md">{loadError}</p>
                <Button variant="outline" size="sm" onClick={handleReload}>
                  Reintentar
                </Button>
              </div>
            ) : (
            <Tabs defaultValue="todos" onValueChange={() => setCurrentPage(1)}>
              <TabsList className="mb-4">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="pendientes">Pendiente Firma Estudiante</TabsTrigger>
                <TabsTrigger value="completados">Completados</TabsTrigger>
              </TabsList>

              <TabsContent value="todos">
                {(() => {
                  const filteredData = getFilteredData(enviadosHoy, 'todos')
                  const paginatedData = getPaginatedData(filteredData)
                  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

                  return (
                    <>
                      {viewMode === 'cards' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {paginatedData.length === 0 ? (
                            <p className="col-span-full text-center py-8">
                              No hay contratos.
                            </p>
                          ) : (
                            paginatedData.map(renderCard)
                          )}
                        </div>
                      ) : (
                        renderTableView(paginatedData)
                      )}
                      
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            Anterior
                          </Button>
                          <span className="text-sm">
                            Página {currentPage} de {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                          >
                            Siguiente
                          </Button>
                        </div>
                      )}
                    </>
                  )
                })()}
              </TabsContent>

              <TabsContent value="pendientes">
                {(() => {
                  const filteredData = getFilteredData(enviadosHoy, 'pendientes')
                  const paginatedData = getPaginatedData(filteredData)
                  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

                  return (
                    <>
                      {viewMode === 'cards' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {paginatedData.length === 0 ? (
                            <p className="col-span-full text-center py-8">
                              No hay contratos pendientes de firma.
                            </p>
                          ) : (
                            paginatedData.map(renderCard)
                          )}
                        </div>
                      ) : (
                        renderTableView(paginatedData)
                      )}
                      
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            Anterior
                          </Button>
                          <span className="text-sm">
                            Página {currentPage} de {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                          >
                            Siguiente
                          </Button>
                        </div>
                      )}
                    </>
                  )
                })()}
              </TabsContent>

              <TabsContent value="completados">
                {(() => {
                  const filteredData = getFilteredData(enviadosHoy, 'completados')
                  const paginatedData = getPaginatedData(filteredData)
                  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

                  return (
                    <>
                      {viewMode === 'cards' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {paginatedData.length === 0 ? (
                            <p className="col-span-full text-center py-8">
                              No hay contratos completados.
                            </p>
                          ) : (
                            paginatedData.map(renderCard)
                          )}
                        </div>
                      ) : (
                        renderTableView(paginatedData)
                      )}
                      
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            Anterior
                          </Button>
                          <span className="text-sm">
                            Página {currentPage} de {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                          >
                            Siguiente
                          </Button>
                        </div>
                      )}
                    </>
                  )
                })()}
              </TabsContent>
            </Tabs>
            )}
          </CardContent>
        </Card>

        <ProspectosPendientes />

        {/* Modal de vista previa del contrato */}
        {contratoSeleccionado && (
          <ContratoVistaModal
            isOpen={modalVistaOpen}
            onClose={() => {
              setModalVistaOpen(false)
              setContratoSeleccionado(null)
            }}
            contratoId={contratoSeleccionado}
          />
        )}
      </main>
    </div>
  )
}

function ProspectosPendientes() {
  const router = useRouter()
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [contratosEnviados, setContratosEnviados] = useState<ContactoEnviado[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const tipos = ["dpi", "recibo", "american", "inscripcion"]

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    const token = localStorage.getItem("token") || ""
    // Solo estados de prospectos en proceso (NO incluye "Inscrito")
    const estados = [
      "Preinscripción",
      "Pendiente Aprobacion",
      "Pendiente de Aprobación Académica",
      "Pendiente de Aprobación Financiera"
    ]

    async function loadProspectos() {
      try {
        const respuestas = await Promise.all(
          estados.map(estado =>
            fetch(
              `${API_BASE_URL}/api/prospectos/status/${encodeURIComponent(
                estado
              )}`,
              { headers: { Authorization: `Bearer ${token}` } }
            ).then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`)
              return res.json()
            })
          )
        )
        const combinados: Prospecto[] = respuestas
          .flatMap(r => (Array.isArray(r.data) ? r.data : []))
          .reduce<Prospecto[]>((acc, p) => {
            if (!acc.find(x => x.id === p.id)) acc.push(p)
            return acc
          }, [])
        setProspectos(combinados)
      } catch (err) {
        console.error("Error cargando prospectos:", err)
        Swal.fire("Error", "No se pudieron cargar los prospectos.", "error")
      }
    }

    async function loadDocumentos() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/documentos`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: Documento[] = await res.json()
        setDocumentos(data)
      } catch (err) {
        console.error("Error cargando documentos:", err)
        Swal.fire("Error", "No se pudieron cargar los documentos.", "error")
      }
    }

    async function loadContratosEnviados() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/contactos-enviados`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: ContactoEnviado[] = await res.json()
        setContratosEnviados(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error cargando contratos enviados:", err)
      }
    }

    loadProspectos()
    loadDocumentos()
    loadContratosEnviados()
  }, [])

  const docsByPros = useMemo(() => {
    return prospectos.reduce<Record<number,string[]>>((acc, p) => {
      acc[p.id] = documentos
        .filter(d => d.prospecto_id === p.id)
        .map(d => d.tipo_documento)
      return acc
    }, {})
  }, [prospectos, documentos])

  // Obtener el estado del contrato para cada prospecto
  const contratoByProspecto = useMemo(() => {
    return prospectos.reduce<Record<number, { enviado: boolean, firmado: boolean, cantidad: number }>>((acc, p) => {
      const contratosDelProspecto = contratosEnviados.filter(c => c.prospecto_id === p.id)
      const cantidad = contratosDelProspecto.length
      const enviado = cantidad > 0
      const firmado = contratosDelProspecto.some(c => c.estado_firma === 'firmado' || c.fecha_firma_estudiante)
      
      acc[p.id] = { enviado, firmado, cantidad }
      return acc
    }, {})
  }, [prospectos, contratosEnviados])

  const toggle = (id: number) =>
    setSelected(sel =>
      sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]
    )

  const filtered = useMemo(() => {
    return prospectos.filter(p =>
      fuzzyMatch([p.nombre_completo ?? '', p.correo_electronico ?? ''], searchTerm)
    )
  }, [prospectos, searchTerm])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage])

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Prospectos Pendientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4 gap-2">
          <Input
            placeholder="Buscar nombre o email"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="w-[250px]"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>✔️</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Contrato</TableHead>
              {tipos.map(t => (
                <TableHead key={t}>{t.toUpperCase()}</TableHead>
              ))}
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6 + tipos.length}
                  className="text-center py-4"
                >
                  No hay prospectos que coincidan.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map(p => {
                const contratoInfo = contratoByProspecto[p.id] || { enviado: false, firmado: false, cantidad: 0 }
                
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(p.id)}
                        onCheckedChange={() => toggle(p.id)}
                      />
                    </TableCell>
                    <TableCell>{p.nombre_completo || 'Sin nombre'}</TableCell>
                    <TableCell>{p.correo_electronico || 'Sin correo'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={
                          p.status === "Inscrito" 
                            ? "bg-green-100 text-green-800 border-green-300"
                            : p.status === "Preinscripción"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : p.status?.includes("Pendiente")
                            ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                            : "bg-gray-100 text-gray-800 border-gray-300"
                        }
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contratoInfo.enviado ? (
                        <div className="flex flex-col gap-1">
                          <Badge 
                            variant="outline"
                            className={
                              contratoInfo.firmado 
                                ? "bg-green-100 text-green-800 border-green-300"
                                : "bg-orange-100 text-orange-800 border-orange-300"
                            }
                          >
                            {contratoInfo.firmado ? "✓ Firmado" : "📧 Enviado"}
                          </Badge>
                          {contratoInfo.cantidad > 1 && (
                            <span className="text-xs text-gray-500">
                              ({contratoInfo.cantidad} contratos)
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                          Sin enviar
                        </Badge>
                      )}
                    </TableCell>
                    {tipos.map(t => (
                      <TableCell key={t}>
                        <Checkbox
                          checked={docsByPros[p.id]?.includes(t) ?? false}
                          disabled
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/firma/student-details/${p.id}`)}
                      >
                        Ver Detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
