"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Mail,
  MessageSquare,
  Users,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  AlertTriangle,
  UserPlus,
  Phone,
  AtSign,
  ArrowRight,
  Copy,
  ExternalLink,
} from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buildEmailTemplate, buildWhatsAppText, type ContactTemplateType } from "@/lib/collectionsTemplates"
import { getProspectos, sendEmailToProspect, getProspectosMoodleCombined, getProspectosInternos, type ProspectoCombinado, getProspectoById } from "@/services/finance"
import { pickTelefono, pickCorreo } from "@/lib/contact/mappers"
import { getPlantillas, type EmailTemplate } from "@/services/mailing"
import ContactProspectDialog from "@/components/finanzas/ContactProspectDialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Prospecto {
  id: number | string
  nombre_completo: string
  carnet?: string
  telefono?: string
  correo_electronico?: string
  correo_corporativo?: string
  telefono_corporativo?: string
  programa?: {
    nombre_del_programa: string
  }
  ciudad?: string
  origen?: "prospecto_con_moodle" | "moodle_sin_prospecto"
  tiene_prospecto?: boolean
  moodle_activo?: boolean
}

export function ContactoMasivoTab() {
  // Estados para prospectos
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set()) // 🆕 Permitir IDs mixtos
  const [selectAllMode, setSelectAllMode] = useState(false) // 🆕 Modo "Todos los prospectos"
  
  // ✅ Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProspectos, setTotalProspectos] = useState(0)
  const [perPage] = useState(200) // ✅ 200 registros por página

  // Filtros
  const [searchQuery, setSearchQuery] = useState("")
  const [programaFilter, setProgramaFilter] = useState<string>("all")
  const [origenFilter, setOrigenFilter] = useState<"all" | "with_prospecto" | "without_prospecto">("all")
  const [mesFilter, setMesFilter] = useState<number>(new Date().getMonth() + 1) // Mes actual
  const [anioFilter, setAnioFilter] = useState<number>(new Date().getFullYear()) // Año actual
  const [usarMoodleCombined, setUsarMoodleCombined] = useState(false) // ✅ No preseleccionado - el usuario debe seleccionarlo

  // 🆕 Plantillas dinámicas desde API
  const [plantillasAPI, setPlantillasAPI] = useState<EmailTemplate[]>([])
  const [loadingPlantillas, setLoadingPlantillas] = useState(false)
  const [tipoPlantilla, setTipoPlantilla] = useState<"hardcoded" | "api">("hardcoded")
  const [plantillaAPISeleccionada, setPlantillaAPISeleccionada] = useState<number | null>(null)

  // Configuración de mensaje
  const [messageType, setMessageType] = useState<"whatsapp" | "email">("email")
  const [templateType, setTemplateType] = useState<ContactTemplateType>("reminder")
  const [customSubject, setCustomSubject] = useState("")
  const [customMessage, setCustomMessage] = useState("")
  const [useCustomMessage, setUseCustomMessage] = useState(false)

  // Estados de envío
  const [sending, setSending] = useState(false)
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0, errors: 0 })

  // ✅ Estado para envío individual
  const [individualDialogOpen, setIndividualDialogOpen] = useState(false)
  const [selectedProspectoForIndividual, setSelectedProspectoForIndividual] = useState<Prospecto | null>(null)
  const [individualProspectoId, setIndividualProspectoId] = useState<number | undefined>(undefined)

  // ✅ Estado para controlar la carga inicial
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Cargar prospectos y plantillas cuando cambian filtros principales
  useEffect(() => {
    setCurrentPage(1) // ✅ Resetear a página 1 cuando cambian filtros principales
    setIsInitialLoad(true)
    loadProspectos()
    loadPlantillasAPI()
  }, [usarMoodleCombined, origenFilter]) // 🔥 No recargar al cambiar mes/año - traer TODOS siempre

  // ✅ Recargar cuando cambia la página (evitar loop infinito)
  useEffect(() => {
    if (!isInitialLoad) {
      loadProspectos()
    } else {
      setIsInitialLoad(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  const loadProspectos = async () => {
    setLoading(true)
    try {
      if (usarMoodleCombined) {
        // 🆕 Cargar datos combinados (prospectos + Moodle) con PAGINACIÓN
        const response = await getProspectosMoodleCombined({
          // No enviar mes/anio para traer TODOS (sin filtro por mes/año)
          filter: origenFilter,
          per_page: perPage, // ✅ Paginación de 200 en 200
          page: currentPage, // ✅ Página actual
        })
        
        const dataCombinada = response.data.map((item: ProspectoCombinado) => ({
          id: item.id,
          nombre_completo: item.nombre_completo,
          carnet: item.carnet,
          correo_electronico: item.correo_electronico,
          telefono: item.telefono,
          correo_corporativo: item.correo_corporativo,
          telefono_corporativo: item.telefono_corporativo,
          programa: (item as any).programa, // Programa desde estudiante_programa o Moodle
          ciudad: item.ciudad,
          origen: item.origen,
          tiene_prospecto: item.tiene_prospecto,
          moodle_activo: item.moodle_activo,
        }))
        
        setProspectos(dataCombinada)
        // ✅ Actualizar datos de paginación
        if (response.meta) {
          setTotalPages(response.meta.last_page || 1)
          setTotalProspectos(response.meta.total || 0)
        }
      } else {
        // ✅ Usar endpoint optimizado de internos (solo CRM) con PAGINACIÓN
        const response = await getProspectosInternos({
          per_page: perPage, // ✅ Paginación de 200 en 200
          page: currentPage, // ✅ Página actual
          ...(searchQuery && { search: searchQuery }),
        })
        
        const dataInternos = response.data.map((item: ProspectoCombinado) => ({
          id: item.id,
          nombre_completo: item.nombre_completo,
          carnet: item.carnet,
          correo_electronico: item.correo_electronico,
          telefono: item.telefono,
          correo_corporativo: item.correo_corporativo,
          telefono_corporativo: item.telefono_corporativo,
          programa: (item as any).programa, // Programa desde estudiante_programa
          ciudad: item.ciudad,
          origen: (item as any).origen || 'crm',
          tiene_prospecto: true,
          moodle_activo: false,
        }))
        
        setProspectos(dataInternos)
        // ✅ Actualizar datos de paginación
        if (response.meta) {
          setTotalPages(response.meta.last_page || 1)
          setTotalProspectos(response.meta.total || 0)
        }
      }
    } catch (error) {
      console.error("Error loading prospectos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los prospectos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 🆕 Cargar plantillas dinámicas desde API
  const loadPlantillasAPI = async () => {
    setLoadingPlantillas(true)
    try {
      const response = await getPlantillas({
        activo: true,
        tipo: messageType === "email" ? "correo" : (messageType === "whatsapp" ? "whatsapp" : "all"),
        perPage: 200, // ✅ Aumentar para traer todas las plantillas activas
      })
      setPlantillasAPI(response.data || [])
    } catch (error) {
      console.error("Error loading plantillas:", error)
      // No mostrar error crítico, las plantillas hardcodeadas siguen disponibles
    } finally {
      setLoadingPlantillas(false)
    }
  }

  // Filtrado de prospectos
  const filteredProspectos = useMemo(() => {
    return prospectos.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.nombre_completo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.carnet?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.correo_electronico?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesPrograma =
        programaFilter === "all" ||
        p.programa?.nombre_del_programa === programaFilter

      return matchesSearch && matchesPrograma
    })
  }, [prospectos, searchQuery, programaFilter])

  // Programas únicos para filtro
  const programasUnicos = useMemo(() => {
    const programas = new Set<string>()
    prospectos.forEach((p) => {
      if (p.programa?.nombre_del_programa) {
        programas.add(p.programa.nombre_del_programa)
      }
    })
    return Array.from(programas).sort()
  }, [prospectos])

  // Manejo de selección
  const toggleSelection = (id: number | string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
    setSelectAllMode(false) // Desactivar modo "todos" al seleccionar manualmente
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProspectos.length && !selectAllMode) {
      setSelectedIds(new Set())
      setSelectAllMode(false)
    } else {
      setSelectedIds(new Set(filteredProspectos.map((p) => p.id)))
      setSelectAllMode(false)
    }
  }

  // 🆕 Seleccionar TODOS los prospectos del sistema (sin filtros)
  const selectAllProspectos = () => {
    setSelectAllMode(true)
    setSelectedIds(new Set(prospectos.map((p) => p.id)))
    toast({
      title: "Todos los prospectos seleccionados",
      description: `${prospectos.length} prospectos del sistema completo`,
    })
  }

  // 🆕 Obtener la lista real de prospectos a enviar
  const getProspectosToSend = () => {
    if (selectAllMode) {
      return prospectos // TODOS sin filtros
    }
    return prospectos.filter((p) => selectedIds.has(p.id))
  }

  // 🆕 Helpers para manejar contactos con tipo flexible
  const getEmail = (prospecto: Prospecto): string | null => {
    return prospecto.correo_electronico || prospecto.correo_corporativo || null
  }

  const getPhone = (prospecto: Prospecto): string | null => {
    return prospecto.telefono || prospecto.telefono_corporativo || null
  }

  // 🆕 Reemplazar variables en plantilla API
  const replaceVariables = (text: string | undefined | null, prospecto: Prospecto): string => {
    // 🔥 Validación: si text es undefined/null, retornar string vacío
    if (!text || typeof text !== 'string') {
      return ""
    }
    
    return text
      .replace(/\{\{nombre\}\}/g, prospecto.nombre_completo || "")
      .replace(/\{\{nombre_completo\}\}/g, prospecto.nombre_completo || "")
      .replace(/\{\{carnet\}\}/g, prospecto.carnet || "")
      .replace(/\{\{programa\}\}/g, prospecto.programa?.nombre_del_programa || "")
      .replace(/\{\{correo\}\}/g, getEmail(prospecto) || "")
      .replace(/\{\{telefono\}\}/g, getPhone(prospecto) || "")
      .replace(/\{\{ciudad\}\}/g, prospecto.ciudad || "")
  }

  // Generar mensaje para vista previa
  const generatePreviewMessage = (prospecto: Prospecto) => {
    const context = {
      nombre: prospecto.nombre_completo,
      programa: prospecto.programa?.nombre_del_programa,
      fecha: undefined,
      monto: undefined,
    }

    if (useCustomMessage) {
      if (messageType === "email") {
        return {
          subject: customSubject || "Mensaje personalizado",
          content: customMessage,
        }
      }
      return { content: customMessage }
    }

    // 🆕 Si usa plantilla de API
    if (tipoPlantilla === "api" && plantillaAPISeleccionada) {
      const plantilla = plantillasAPI.find((p) => p.id === plantillaAPISeleccionada)
      if (plantilla) {
        // 🔥 Mapear campos del backend (contenido_html) al frontend (cuerpo)
        // El backend devuelve: contenido_html, asunto
        // El frontend espera: cuerpo, asunto
        const plantillaAny = plantilla as any
        
        // 🔥 Validar que asunto exista y no sea undefined/null
        const asunto = (plantillaAny.asunto && typeof plantillaAny.asunto === 'string') 
          ? plantillaAny.asunto 
          : ""
        
        // 🔥 Intentar obtener contenido en este orden: contenido_html (BD), cuerpo, contenido_texto
        const contenido = (plantillaAny.contenido_html && typeof plantillaAny.contenido_html === 'string')
          ? plantillaAny.contenido_html
          : (plantillaAny.cuerpo && typeof plantillaAny.cuerpo === 'string')
          ? plantillaAny.cuerpo
          : (plantillaAny.contenido_texto && typeof plantillaAny.contenido_texto === 'string')
          ? plantillaAny.contenido_texto
          : (plantillaAny.cuerpo_texto && typeof plantillaAny.cuerpo_texto === 'string')
          ? plantillaAny.cuerpo_texto
          : ""
        
        return {
          subject: replaceVariables(asunto, prospecto),
          content: replaceVariables(contenido, prospecto),
        }
      }
    }

    // Plantillas hardcodeadas (por defecto)
    if (messageType === "email") {
      const template = buildEmailTemplate(templateType, context)
      return {
        subject: template.subject,
        content: template.html,
      }
    } else {
      return {
        content: buildWhatsAppText(templateType, context),
      }
    }
  }

  // Enviar mensajes masivos
  const handleSendMassive = async () => {
    const prospectosToSend = getProspectosToSend()
    
    if (prospectosToSend.length === 0) {
      toast({
        title: "Sin destinatarios",
        description: "Seleccione al menos un prospecto para enviar mensajes",
        variant: "destructive",
      })
      return
    }

    if (messageType === "email" && !useCustomMessage && !customSubject) {
      toast({
        title: "Asunto requerido",
        description: "Debe especificar un asunto para el correo",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    setSendProgress({ sent: 0, total: prospectosToSend.length, errors: 0 })

    for (const prospecto of prospectosToSend) {
      try {
        const message = generatePreviewMessage(prospecto)

        if (messageType === "email") {
          const email = getEmail(prospecto)
          if (!email) {
            setSendProgress((prev) => ({ ...prev, errors: prev.errors + 1 }))
            continue
          }

          await sendEmailToProspect({
            to: email,
            subject: message.subject || customSubject,
            html: message.content,
          })
        } else {
          // Para WhatsApp, solo mostrar el mensaje (requiere integración externa)
          const telefono = getPhone(prospecto)
          if (!telefono) {
            setSendProgress((prev) => ({ ...prev, errors: prev.errors + 1 }))
            continue
          }

          // Aquí iría la lógica de envío de WhatsApp
          console.log(`WhatsApp a ${telefono}: ${message.content}`)
          
          // Abrir WhatsApp Web (temporal)
          const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(message.content)}`
          window.open(whatsappUrl, '_blank')
        }

        setSendProgress((prev) => ({ ...prev, sent: prev.sent + 1 }))
        
        // Delay para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Error sending to ${prospecto.nombre_completo}:`, error)
        setSendProgress((prev) => ({ ...prev, errors: prev.errors + 1 }))
      }
    }

    setSending(false)
    
    toast({
      title: "Envío completado",
      description: `${sendProgress.sent} mensajes enviados, ${sendProgress.errors} errores`,
    })

    // Limpiar selección
    setSelectedIds(new Set())
    setSelectAllMode(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contacto y Mensajería Masiva
          </CardTitle>
          <CardDescription>
            Envíe mensajes personalizados a múltiples prospectos a la vez
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros y búsqueda */}
          <div className="flex flex-col gap-3">
            {/* 🆕 Toggle para datos combinados */}
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="usarMoodleCombined"
                  checked={usarMoodleCombined}
                  onCheckedChange={(checked) => setUsarMoodleCombined(!!checked)}
                />
                <Label htmlFor="usarMoodleCombined" className="cursor-pointer font-medium">
                  Incluir estudiantes de Moodle (activos este mes)
                </Label>
              </div>
              {usarMoodleCombined && (
                <Badge variant="secondary">
                  {mesFilter}/{anioFilter}
                </Badge>
              )}
            </div>

            {/* Filtros principales */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nombre, carnet o correo..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* 🆕 Filtro de origen (solo si usa Moodle combined) */}
              {usarMoodleCombined && (
                <Select value={origenFilter} onValueChange={(v: any) => setOrigenFilter(v)}>
                  <SelectTrigger className="w-full md:w-[250px]">
                    <SelectValue placeholder="Filtrar por origen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="with_prospecto">
                      ✓ Con registro de prospecto
                    </SelectItem>
                    <SelectItem value="without_prospecto">
                      ⚠ Solo en Moodle (sin prospecto)
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* 🆕 Selector de mes/año (solo si usa Moodle combined) */}
              {usarMoodleCombined && (
                <>
                  <Select
                    value={mesFilter.toString()}
                    onValueChange={(v) => setMesFilter(parseInt(v))}
                  >
                    <SelectTrigger className="w-full md:w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                        <SelectItem key={mes} value={mes.toString()}>
                          {new Date(2024, mes - 1).toLocaleString("es", { month: "long" })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={anioFilter.toString()}
                    onValueChange={(v) => setAnioFilter(parseInt(v))}
                  >
                    <SelectTrigger className="w-full md:w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((anio) => (
                        <SelectItem key={anio} value={anio.toString()}>
                          {anio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}

              <Select value={programaFilter} onValueChange={setProgramaFilter}>
                <SelectTrigger className="w-full md:w-[250px]">
                  <SelectValue placeholder="Filtrar por programa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los programas</SelectItem>
                  {programasUnicos.map((programa) => (
                    <SelectItem key={programa} value={programa}>
                      {programa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button onClick={loadProspectos} disabled={loading} variant="outline" className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Actualizar
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Selección y configuración */}
          <Tabs defaultValue="recipients" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recipients">
                Destinatarios ({selectedIds.size})
              </TabsTrigger>
              <TabsTrigger value="message">Mensaje</TabsTrigger>
            </TabsList>

            {/* Tab de Destinatarios */}
            <TabsContent value="recipients" className="space-y-4">
              {/* Alerta cuando están todos seleccionados */}
              {selectAllMode && (
                <Alert className="border-primary bg-primary/5">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Modo masivo activado</AlertTitle>
                  <AlertDescription>
                    Se enviarán mensajes a <strong>TODOS los {totalProspectos > 0 ? totalProspectos : prospectos.length} prospectos</strong> del sistema,
                    independientemente de los filtros aplicados. Esta acción enviará un gran volumen de mensajes.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-sm space-y-1">
                  <div className="font-medium">
                    {selectAllMode ? (
                      <span className="text-primary">
                        🌐 Todos los prospectos: {totalProspectos > 0 ? totalProspectos : prospectos.length}
                      </span>
                    ) : (
                      <>
                        {selectedIds.size} de {filteredProspectos.length} seleccionados
                        {totalPages > 1 && ` (página ${currentPage})`}
                      </>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {totalProspectos > 0 ? (
                      <>
                        Total en sistema: {totalProspectos} prospectos
                        {totalPages > 1 && ` • Página ${currentPage} de ${totalPages} (${perPage} por página)`}
                      </>
                    ) : (
                      `Total en sistema: ${prospectos.length} prospectos`
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                    disabled={selectAllMode}
                  >
                    {selectedIds.size === filteredProspectos.length && !selectAllMode
                      ? "Deseleccionar filtrados"
                      : "Seleccionar filtrados"}
                  </Button>
                  <Button
                    variant={selectAllMode ? "default" : "secondary"}
                    size="sm"
                    onClick={selectAllProspectos}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    {selectAllMode ? "✓ Todos seleccionados" : "Seleccionar TODOS"}
                  </Button>
                  {(selectedIds.size > 0 || selectAllMode) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedIds(new Set())
                        setSelectAllMode(false)
                      }}
                    >
                      Limpiar selección
                    </Button>
                  )}
                </div>
              </div>

              <div className="border rounded-lg max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Carnet</TableHead>
                      <TableHead>Programa</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead className="w-[120px] text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProspectos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No se encontraron prospectos
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProspectos.map((prospecto) => {
                        const email = getEmail(prospecto)
                        const phone = getPhone(prospecto)
                        const hasContact = !!(email || phone)
                        
                        return (
                          <TableRow key={prospecto.id} className="hover:bg-muted/50">
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(prospecto.id)}
                              onCheckedChange={() => toggleSelection(prospecto.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <UserPlus className="h-4 w-4 text-muted-foreground" />
                            {prospecto.nombre_completo}
                              </div>
                          </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {prospecto.carnet || "—"}
                              </Badge>
                            </TableCell>
                          <TableCell className="text-sm">
                              {typeof prospecto.programa === 'string' 
                                ? prospecto.programa 
                                : prospecto.programa?.nombre_del_programa || "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                              <div className="space-y-1">
                                {email ? (
                                  <div className="flex items-center gap-1 text-blue-600">
                                    <AtSign className="h-3 w-3" />
                                    <span className="truncate max-w-[150px]" title={email}>
                                      {email}
                                    </span>
                            </div>
                                ) : (
                                  <div className="text-muted-foreground flex items-center gap-1">
                                    <AtSign className="h-3 w-3" />
                                    Sin correo
                                  </div>
                                )}
                                {phone ? (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <Phone className="h-3 w-3" />
                                    <span>{phone}</span>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    Sin teléfono
                                  </div>
                                )}
                            {prospecto.origen && (
                                  <Badge 
                                    variant={prospecto.tiene_prospecto ? "default" : "secondary"} 
                                    className="mt-1 text-[10px]"
                                  >
                                    {String(prospecto.origen).includes("moodle") && String(prospecto.origen).includes("crm")
                                      ? "Combinado"
                                      : String(prospecto.origen).includes("moodle")
                                      ? "Moodle"
                                      : String(prospecto.origen).includes("crm")
                                      ? "CRM"
                                      : String(prospecto.origen)}
                              </Badge>
                            )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // ✅ Intentar obtener el ID numérico del prospecto
                                    const prospectoId = typeof prospecto.id === 'number' 
                                      ? prospecto.id 
                                      : (typeof prospecto.id === 'string' && prospecto.id.startsWith('moodle_'))
                                        ? undefined 
                                        : parseInt(prospecto.id as string) || undefined
                                    
                                    setIndividualProspectoId(prospectoId)
                                    setSelectedProspectoForIndividual(prospecto)
                                    setIndividualDialogOpen(true)
                                  }}
                                  disabled={!hasContact}
                                  className="h-8 px-2"
                                  title={hasContact ? "Enviar mensaje individual" : "Sin contacto disponible"}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                                {email && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      window.location.href = `mailto:${email}`
                                    }}
                                    className="h-8 px-2"
                                    title={`Abrir cliente de correo para ${email}`}
                                  >
                                    <Mail className="h-4 w-4 text-blue-600" />
                                  </Button>
                                )}
                                {phone && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const whatsappUrl = `https://wa.me/${phone.replace(/[^\d]/g, '')}`
                                      window.open(whatsappUrl, '_blank')
                                    }}
                                    className="h-8 px-2"
                                    title={`Abrir WhatsApp para ${phone}`}
                                  >
                                    <MessageSquare className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                              </div>
                          </TableCell>
                        </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* ✅ Controles de Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalProspectos)} de {totalProspectos} prospectos
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1)
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }
                          }}
                          className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {/* Páginas visibles */}
                      {(() => {
                        const pages: (number | string)[] = []
                        const maxVisible = 5
                        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
                        let endPage = Math.min(totalPages, startPage + maxVisible - 1)
                        
                        if (endPage - startPage < maxVisible - 1) {
                          startPage = Math.max(1, endPage - maxVisible + 1)
                        }
                        
                        if (startPage > 1) {
                          pages.push(1)
                          if (startPage > 2) pages.push('ellipsis-start')
                        }
                        
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(i)
                        }
                        
                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) pages.push('ellipsis-end')
                          pages.push(totalPages)
                        }
                        
                        return pages.map((page, idx) => {
                          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                            return (
                              <PaginationItem key={`ellipsis-${idx}`}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )
                          }
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setCurrentPage(page as number)
                                  window.scrollTo({ top: 0, behavior: 'smooth' })
                                }}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        })
                      })()}
                      
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1)
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }
                          }}
                          className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </TabsContent>

            {/* Tab de Mensaje */}
            <TabsContent value="message" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de mensaje</Label>
                    <Select
                      value={messageType}
                      onValueChange={(v: any) => setMessageType(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Correo electrónico
                          </div>
                        </SelectItem>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            WhatsApp
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Plantilla</Label>
                    <Select
                      value={templateType}
                      onValueChange={(v: any) => setTemplateType(v)}
                      disabled={useCustomMessage || tipoPlantilla === "api"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overdue">Pago atrasado</SelectItem>
                        <SelectItem value="due_soon">Pago próximo</SelectItem>
                        <SelectItem value="reminder">Recordatorio general</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 🆕 Selector de tipo de plantilla */}
                <div className="space-y-2">
                  <Label>Origen de plantilla</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={tipoPlantilla === "hardcoded" ? "default" : "outline"}
                      onClick={() => {
                        setTipoPlantilla("hardcoded")
                        setPlantillaAPISeleccionada(null)
                      }}
                      disabled={useCustomMessage}
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Plantillas predefinidas
                    </Button>
                    <Button
                      type="button"
                      variant={tipoPlantilla === "api" ? "default" : "outline"}
                      onClick={() => setTipoPlantilla("api")}
                      disabled={useCustomMessage || loadingPlantillas}
                      className="flex-1"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {loadingPlantillas ? "Cargando..." : `Plantillas dinámicas (${plantillasAPI.length})`}
                    </Button>
                  </div>
                </div>

                {/* 🆕 Selector de plantilla API */}
                {tipoPlantilla === "api" && (
                  <div className="space-y-2">
                    <Label>Seleccionar plantilla</Label>
                    <Select
                      value={plantillaAPISeleccionada?.toString() || ""}
                      onValueChange={(v) => setPlantillaAPISeleccionada(v ? parseInt(v) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una plantilla..." />
                      </SelectTrigger>
                      <SelectContent>
                        {plantillasAPI
                          .filter((p) => {
                            // 🔥 Corregido: comparar correctamente (messageType es "email", pero BD usa "correo")
                            const tipoPlantilla = (p.tipo === "correo" || p.tipo === "email") ? "email" : p.tipo
                            return tipoPlantilla === messageType
                          })
                          .map((plantilla) => (
                            <SelectItem key={plantilla.id} value={plantilla.id.toString()}>
                              <div className="flex flex-col">
                                <span className="font-medium">{plantilla.nombre}</span>
                                {plantilla.descripcion && (
                                  <span className="text-xs text-muted-foreground">
                                    {plantilla.descripcion}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        {plantillasAPI.filter((p) => {
                          // 🔥 Corregido: normalizar tipos para comparación
                          const tipoPlantilla = (p.tipo === "correo" || p.tipo === "email") ? "email" : p.tipo
                          return tipoPlantilla === messageType
                        }).length === 0 && (
                          <SelectItem value="none" disabled>
                            No hay plantillas de tipo {messageType}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="customMessage"
                    checked={useCustomMessage}
                    onCheckedChange={(checked) => setUseCustomMessage(!!checked)}
                  />
                  <Label htmlFor="customMessage" className="cursor-pointer">
                    Usar mensaje personalizado
                  </Label>
                </div>

                {useCustomMessage && (
                  <div className="space-y-4">
                    {messageType === "email" && (
                      <div className="space-y-2">
                        <Label>Asunto</Label>
                        <Input
                          value={customSubject}
                          onChange={(e) => setCustomSubject(e.target.value)}
                          placeholder="Asunto del correo"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Mensaje</Label>
                      <Textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Escribe tu mensaje personalizado..."
                        rows={8}
                      />
                    </div>
                  </div>
                )}

                {/* Vista previa */}
                {!useCustomMessage && (
                  <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4" />
                      Vista previa de plantilla
                    </div>
                    <Separator />
                    {(() => {
                      const preview = generatePreviewMessage({
                        id: 0,
                        nombre_completo: "[Nombre del prospecto]",
                        programa: { nombre_del_programa: "[Programa]" },
                      } as Prospecto)
                      return (
                        <div className="text-sm space-y-2">
                          {preview.subject && (
                            <div>
                              <strong>Asunto:</strong> {preview.subject}
                            </div>
                          )}
                          <div className="whitespace-pre-wrap">
                            {preview.content.replace(/<[^>]*>/g, "")}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Acciones de envío */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium">
                {selectAllMode ? (
                  <>
                    🌐 <strong>{prospectos.length}</strong> prospectos del sistema completo
                  </>
                ) : (
                  <>
                    {selectedIds.size} destinatario{selectedIds.size !== 1 ? "s" : ""} seleccionado{selectedIds.size !== 1 ? "s" : ""}
                  </>
                )}
              </div>
              {sending && (
                <div className="text-xs text-muted-foreground">
                  Enviando: {sendProgress.sent}/{sendProgress.total} 
                  {sendProgress.errors > 0 && ` (${sendProgress.errors} errores)`}
                </div>
              )}
            </div>

            <Button
              onClick={handleSendMassive}
              disabled={(selectedIds.size === 0 && !selectAllMode) || sending}
              size="lg"
              variant={selectAllMode ? "default" : "default"}
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {selectAllMode 
                    ? `Enviar a TODOS (${prospectos.length})` 
                    : `Enviar mensajes (${selectedIds.size})`}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Modal de Envío Individual */}
      <ContactProspectDialog
        open={individualDialogOpen}
        onOpenChange={(open) => {
          setIndividualDialogOpen(open)
          if (!open) {
            setSelectedProspectoForIndividual(null)
            setIndividualProspectoId(undefined)
          }
        }}
        prospectoId={individualProspectoId}
        contextoPago={
          selectedProspectoForIndividual
            ? {
                nombre: selectedProspectoForIndividual.nombre_completo,
                programa:
                  typeof selectedProspectoForIndividual.programa === 'string'
                    ? selectedProspectoForIndividual.programa
                    : selectedProspectoForIndividual.programa?.nombre_del_programa,
              }
            : undefined
        }
      />
    </div>
  )
}
