"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Plus, Send, Trash, Edit, Eye, Copy, Loader2, FileText, Calendar, Activity } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  fetchPlantillas,
  createPlantilla,
  updatePlantilla,
  deletePlantilla,
  duplicatePlantilla,
  fetchVariables,
  fetchEnvios,
  enviarMasivo,
  cancelarEnvio,
  previewPlantilla,
  type EmailTemplate,
  type EmailSending,
  type Variable,
} from "@/services/plantillasMailing"
// Import new components
import { KPIDashboard } from "@/components/plantillas-mailing/KPIDashboard"
import { PlantillasRecientes } from "@/components/plantillas-mailing/PlantillasRecientes"
import { VariablePicker } from "@/components/plantillas-mailing/VariablePicker"
import { HistoryPanel } from "@/components/plantillas-mailing/HistoryPanel"
import { BulkSendModal } from "@/components/plantillas-mailing/BulkSendModal"
import { SimplifiedBulkSendModal } from "@/components/plantillas-mailing/SimplifiedBulkSendModal"
import { RichTextEditor } from "@/components/plantillas-mailing/RichTextEditor"

export default function PlantillasMailingPage() {
  const [activeTab, setActiveTab] = useState<string>("templates")
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [envios, setEnvios] = useState<EmailSending[]>([])
  const [variables, setVariables] = useState<Variable[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current_page: 1, total: 0, per_page: 10 })
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false) // Legacy - will be replaced by BulkSendModal
  const [showBulkSendModal, setShowBulkSendModal] = useState(false) // New modal
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [previewContent, setPreviewContent] = useState<string>("")

  const [formData, setFormData] = useState({
    nombre: "",
    asunto: "",
    contenido_html: "",
    contenido_texto: "",
    tipo: "correo" as "correo" | "documento",
    categoria: "general" as EmailTemplate["categoria"],
    descripcion: "",
    activo: true,
  })

  const [sendFormData, setSendFormData] = useState({
    template_id: 0,
    tipo_destinatarios: "todos" as "todos" | "filtrado" | "manual",
    enviar_inmediato: true,
    filtros: {
      programa_id: "all" as "all" | number,
      activo: true,
    },
  })

  const [filters, setFilters] = useState({
    tipo: "all" as "all" | "correo" | "documento",
    categoria: "all" as "all" | EmailTemplate["categoria"],
    activo: undefined as boolean | undefined,
    search: "",
    page: 1,
  })

  useEffect(() => {
    loadVariables()
  }, [])

  useEffect(() => {
    if (activeTab === "templates") {
      loadPlantillas()
    } else if (activeTab === "history") {
      loadEnvios()
    }
  }, [activeTab, filters])

  const loadVariables = async () => {
    try {
      console.log('Cargando variables...')
      const data = await fetchVariables()
      console.log('Variables cargadas:', data)
      setVariables(data)
    } catch (error) {
      console.error('Error cargando variables:', error)
      toast.error("Error al cargar variables")
    }
  }

  const loadPlantillas = async () => {
    setLoading(true)
    try {
      console.log('Cargando plantillas con filtros:', filters)
      const response = await fetchPlantillas(filters)
      console.log('Respuesta de plantillas:', response)
      setTemplates(response.data)
      setPagination({ current_page: response.current_page, total: response.total, per_page: response.per_page })
    } catch (error) {
      console.error('Error cargando plantillas:', error)
      toast.error("Error al cargar plantillas")
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const loadEnvios = async () => {
    setLoading(true)
    try {
      console.log('Cargando envíos...')
      const response = await fetchEnvios({ page: filters.page })
      console.log('Respuesta de envíos:', response)
      setEnvios(response.data)
      setPagination({ current_page: response.current_page, total: response.total, per_page: response.per_page })
    } catch (error) {
      console.error('Error cargando historial:', error)
      toast.error("Error al cargar historial")
      setEnvios([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!formData.nombre || !formData.asunto) {
      toast.error("Complete los campos requeridos")
      return
    }
    try {
      setLoading(true)
      await createPlantilla(formData)
      toast.success("Plantilla creada exitosamente")
      setShowTemplateDialog(false)
      resetForm()
      loadPlantillas()
    } catch (error) {
      toast.error("Error al crear plantilla")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return
    try {
      setLoading(true)
      await updatePlantilla(selectedTemplate.id, formData)
      toast.success("Plantilla actualizada")
      setShowTemplateDialog(false)
      resetForm()
      loadPlantillas()
    } catch (error) {
      toast.error("Error al actualizar plantilla")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm("¿Eliminar esta plantilla?")) return
    try {
      setLoading(true)
      await deletePlantilla(id)
      toast.success("Plantilla eliminada")
      loadPlantillas()
    } catch (error) {
      toast.error("Error al eliminar plantilla")
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicateTemplate = async (id: number) => {
    try {
      setLoading(true)
      await duplicatePlantilla(id)
      toast.success("Plantilla duplicada")
      loadPlantillas()
    } catch (error) {
      toast.error("Error al duplicar plantilla")
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async (template: EmailTemplate) => {
    try {
      setLoading(true)
      const response = await previewPlantilla(template.id)
      setPreviewContent(response.preview)
      setShowPreviewDialog(true)
    } catch (error) {
      toast.error("Error al previsualizar")
    } finally {
      setLoading(false)
    }
  }

  const handleSendMasivo = async () => {
    if (!sendFormData.template_id) {
      toast.error("Seleccione una plantilla")
      return
    }
    try {
      setLoading(true)
      const response = await enviarMasivo(sendFormData)
      toast.success(`Envío programado: ${response.total_destinatarios} destinatarios`)
      setShowSendDialog(false)
      setSendFormData({ template_id: 0, tipo_destinatarios: "todos", enviar_inmediato: true, filtros: { programa_id: "all", activo: true } })
      setActiveTab("history")
    } catch (error) {
      toast.error("Error al enviar")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEnvio = async (id: number) => {
    if (!confirm("¿Cancelar este envío?")) return
    try {
      setLoading(true)
      await cancelarEnvio(id)
      toast.success("Envío cancelado")
      loadEnvios()
    } catch (error) {
      toast.error("Error al cancelar")
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      nombre: template.nombre,
      asunto: template.asunto,
      contenido_html: template.contenido_html,
      contenido_texto: template.contenido_texto || "",
      tipo: template.tipo,
      categoria: template.categoria,
      descripcion: template.descripcion || "",
      activo: template.activo,
    })
    setShowTemplateDialog(true)
  }

  const resetForm = () => {
    setSelectedTemplate(null)
    setFormData({ nombre: "", asunto: "", contenido_html: "", contenido_texto: "", tipo: "correo", categoria: "general", descripcion: "", activo: true })
  }

  const handleInsertVariable = (variableName: string) => {
    const variableTag = `{{${variableName}}}`
    setFormData({ ...formData, contenido_html: formData.contenido_html + variableTag })
  }

  const getUsedVariables = () => {
    const regex = /\{\{(\w+)\}\}/g
    const matches = formData.contenido_html.matchAll(regex)
    return Array.from(matches).map(m => m[1])
  }

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = { completado: "bg-green-500", enviando: "bg-blue-500", programado: "bg-yellow-500", fallido: "bg-red-500", cancelado: "bg-gray-500" }
    return <Badge className={colors[estado] || "bg-gray-500"}>{estado.toUpperCase()}</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-4 rounded text-xs font-mono">
          <strong>Debug Info:</strong><br />
          Templates: {templates?.length || 0} | 
          Envíos: {envios?.length || 0} | 
          Variables: {variables?.length || 0} | 
          Loading: {loading ? 'Yes' : 'No'} | 
          Active Tab: {activeTab}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Plantillas y Mailing</h1>
        <div className="flex gap-2">
          {activeTab === "templates" && (
            <Button onClick={() => { resetForm(); setShowTemplateDialog(true) }}>
              <Plus className="h-4 w-4 mr-2" />Nueva Plantilla
            </Button>
          )}
          {activeTab === "templates" && templates?.length > 0 && (
            <Button onClick={() => setShowBulkSendModal(true)} variant="outline">
              <Send className="h-4 w-4 mr-2" />Enviar Masivo
            </Button>
          )}
        </div>
      </div>

      {/* KPI Dashboard */}
      <KPIDashboard dias={30} onRefresh={() => { loadPlantillas(); loadEnvios(); }} />

      {/* Plantillas Recientes en sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="templates"><FileText className="h-4 w-4 mr-2" />Plantillas</TabsTrigger>
              <TabsTrigger value="history"><Calendar className="h-4 w-4 mr-2" />Historial</TabsTrigger>
              <TabsTrigger value="activity"><Activity className="h-4 w-4 mr-2" />Actividad</TabsTrigger>
            </TabsList>
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div><Label>Búsqueda</Label><Input placeholder="Buscar..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></div>
                <div><Label>Tipo</Label><Select value={filters.tipo} onValueChange={(value: any) => setFilters({ ...filters, tipo: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="correo">Correo</SelectItem><SelectItem value="documento">Documento</SelectItem></SelectContent></Select></div>
                <div><Label>Categoría</Label><Select value={filters.categoria} onValueChange={(value: any) => setFilters({ ...filters, categoria: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem><SelectItem value="bienvenida">Bienvenida</SelectItem><SelectItem value="recordatorio">Recordatorio</SelectItem><SelectItem value="notificacion">Notificación</SelectItem><SelectItem value="invitacion">Invitación</SelectItem><SelectItem value="certificado">Certificado</SelectItem><SelectItem value="general">General</SelectItem></SelectContent></Select></div>
                <div className="flex items-end"><Button onClick={() => loadPlantillas()} className="w-full">Buscar</Button></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Plantillas ({pagination.total})</CardTitle></CardHeader>
            <CardContent>
              {loading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : !templates || templates.length === 0 ? <div className="text-center p-8 text-gray-500">No hay plantillas</div> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Asunto</TableHead><TableHead>Tipo</TableHead><TableHead>Categoría</TableHead><TableHead>Estado</TableHead><TableHead>Actualizado</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {templates.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.nombre}</TableCell>
                        <TableCell>{t.asunto}</TableCell>
                        <TableCell><Badge variant="outline">{t.tipo}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{t.categoria}</Badge></TableCell>
                        <TableCell><Badge className={t.activo ? "bg-green-500" : "bg-gray-500"}>{t.activo ? "ACTIVO" : "INACTIVO"}</Badge></TableCell>
                        <TableCell>{t.updated_at ? new Date(t.updated_at).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handlePreview(t)}><Eye className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => openEditDialog(t)}><Edit className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDuplicateTemplate(t.id)}><Copy className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteTemplate(t.id)}><Trash className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Historial ({pagination.total})</CardTitle></CardHeader>
            <CardContent>
              {loading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : !envios || envios.length === 0 ? <div className="text-center p-8 text-gray-500">No hay envíos</div> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Plantilla</TableHead><TableHead>Asunto</TableHead><TableHead>Destinatarios</TableHead><TableHead>Enviados</TableHead><TableHead>Fallidos</TableHead><TableHead>Abiertos</TableHead><TableHead>Estado</TableHead><TableHead>Fecha</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {envios.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.template?.nombre || "-"}</TableCell>
                        <TableCell>{e.asunto}</TableCell>
                        <TableCell>{e.total_destinatarios}</TableCell>
                        <TableCell>{e.enviados}</TableCell>
                        <TableCell>{e.fallidos}</TableCell>
                        <TableCell>{e.abiertos} ({e.tasa_apertura || 0}%)</TableCell>
                        <TableCell>{getEstadoBadge(e.estado)}</TableCell>
                        <TableCell>{e.created_at ? new Date(e.created_at).toLocaleString() : "-"}</TableCell>
                        <TableCell>{e.estado === "programado" && <Button size="sm" variant="destructive" onClick={() => handleCancelEnvio(e.id)}>Cancelar</Button>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity">
          <HistoryPanel />
        </TabsContent>
      </Tabs>
        </div>

        {/* Sidebar with PlantillasRecientes */}
        <div className="lg:col-span-1">
          <PlantillasRecientes
            plantillas={templates.slice(0, 5) as any}
            loading={loading}
            onEdit={(plantilla: any) => openEditDialog(templates.find(t => t.id === plantilla.id)!)}
          />
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? "Editar" : "Nueva"} Plantilla</DialogTitle>
            <DialogDescription>Complete los datos de la plantilla</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nombre *</Label><Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Nombre" /></div>
              <div><Label>Tipo</Label><Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="correo">Correo</SelectItem><SelectItem value="documento">Documento</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label>Asunto *</Label><Input value={formData.asunto} onChange={(e) => setFormData({ ...formData, asunto: e.target.value })} placeholder="Asunto" /></div>
            <div><Label>Categoría</Label><Select value={formData.categoria} onValueChange={(value: any) => setFormData({ ...formData, categoria: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bienvenida">Bienvenida</SelectItem><SelectItem value="recordatorio">Recordatorio</SelectItem><SelectItem value="notificacion">Notificación</SelectItem><SelectItem value="invitacion">Invitación</SelectItem><SelectItem value="certificado">Certificado</SelectItem><SelectItem value="general">General</SelectItem></SelectContent></Select></div>
            
            <div>
              <Label>Contenido del Correo *</Label>
              <RichTextEditor
                value={formData.contenido_html}
                onChange={(html) => setFormData({ ...formData, contenido_html: html })}
                variables={variables}
                placeholder="Escribe el contenido de tu correo aquí..."
              />
            </div>
            
            <div><Label>Descripción</Label><Textarea value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} placeholder="Descripción" /></div>
            <div className="flex items-center space-x-2"><Switch checked={formData.activo} onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })} /><Label>Plantilla activa</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Cancelar</Button>
            <Button onClick={selectedTemplate ? handleUpdateTemplate : handleCreateTemplate} disabled={loading}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{selectedTemplate ? "Actualizar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envío Masivo</DialogTitle>
            <DialogDescription>Configure el envío masivo</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>Plantilla *</Label><Select value={String(sendFormData.template_id)} onValueChange={(value) => setSendFormData({ ...sendFormData, template_id: parseInt(value) })}><SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger><SelectContent>{(templates || []).filter((t) => t.activo && t.tipo === "correo").map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.nombre}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Destinatarios</Label><Select value={sendFormData.tipo_destinatarios} onValueChange={(value: any) => setSendFormData({ ...sendFormData, tipo_destinatarios: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="filtrado">Filtrados</SelectItem><SelectItem value="manual">Manual</SelectItem></SelectContent></Select></div>
            {sendFormData.tipo_destinatarios === "filtrado" && <div><Label>Solo activos</Label><div className="flex items-center space-x-2 mt-2"><Switch checked={sendFormData.filtros.activo} onCheckedChange={(checked) => setSendFormData({ ...sendFormData, filtros: { ...sendFormData.filtros, activo: checked } })} /><span className="text-sm">Filtrar solo activos</span></div></div>}
            <div className="flex items-center space-x-2"><Switch checked={sendFormData.enviar_inmediato} onCheckedChange={(checked) => setSendFormData({ ...sendFormData, enviar_inmediato: checked })} /><Label>Enviar inmediatamente</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>Cancelar</Button>
            <Button onClick={handleSendMasivo} disabled={loading}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}<Send className="h-4 w-4 mr-2" />Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Vista Previa</DialogTitle></DialogHeader>
          <div className="border rounded p-4 bg-white" dangerouslySetInnerHTML={{ __html: previewContent }} />
          <DialogFooter><Button onClick={() => setShowPreviewDialog(false)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Simplified Bulk Send Modal */}
      <SimplifiedBulkSendModal
        open={showBulkSendModal}
        onOpenChange={setShowBulkSendModal}
        onSuccess={() => {
          loadEnvios()
          loadPlantillas()
          setActiveTab("history")
        }}
      />
    </div>
  )
}
