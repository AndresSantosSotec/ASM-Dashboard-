"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { API_BASE_URL } from '@/utils/apiConfig'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Download,
  Upload,
  Send,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  IdCard,
  FileSpreadsheet,
  Mail,
  FileText,
  X,
  MessageCircle,
  User,
  UserCheck,
  AlertTriangle,
  Pencil
} from "lucide-react"
import { ModalEditarCarnetProspecto, type ProspectoCarnetRow } from "@/components/academico/ModalEditarCarnetProspecto"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProspectoRaw {
  id: number
  prospecto_id: number
  carnet: string
  modalidad: string
  dia_1: string
  dia_2: string
  dia_3: string
  mes_ingreso: string
  inscripcion: number
  mensualidad: string
  nombres: string
  apellidos: string
  telefono: string
  email: string
  programa: string
  asesor: string
  nombre_completo: string
  tiene_carnet: boolean
  datos_completos: boolean
  campos_faltantes: string[]
  tiene_usuario?: boolean
  usuario_id?: number | null
  ya_enviado?: boolean
  programas: Array<{
    duracion_meses: number | null
    programa: {
      nombre_del_programa: string
      abreviatura: string
    }
  }>
}

interface CredencialMicrosoft {
  prospecto_id: number
  nombre_completo: string
  correo_electronico: string
  correo_corporativo: string
  carnet: string
  telefono?: string
  password_temporal: string
  username: string
  display_name: string
  asesor_id?: number | null
  asesor_nombre?: string
  tiene_usuario?: boolean
  usuario_id?: number | null
  monto_inscripcion?: number
  ya_enviado?: boolean
}

interface Estadisticas {
  total_pendientes: number
  con_carnet: number
  sin_carnet: number
  listos_para_enviar: number
  usuarios_creados: number
  credenciales_enviadas: number
  sin_usuario: number
}

const steps = [
  { id: 1, title: "Generar Carnets y Plantillas", icon: CheckCircle2, description: "Carnets y descarga MS/Moodle" },
  { id: 2, title: "Descargar Plantillas", icon: Download, description: "Descargar CSV para procesar" },
  { id: 3, title: "Cargar CSV y Enviar Credenciales", icon: Mail, description: "Cargar CSV procesado y enviar" },
]

// Helper para formatear números de forma segura
const formatNumber = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return '0.00'
  }
  const num = typeof value === 'number' ? value : parseFloat(value.toString())
  if (isNaN(num)) {
    return '0.00'
  }
  return num.toFixed(2)
}

export function GeneracionCredenciales() {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [prospectos, setProspectos] = useState<ProspectoRaw[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  
  // Filtros
  const [filtros, setFiltros] = useState({
    fecha_inicio_desde: "",
    fecha_inicio_hasta: "",
    programa_id: "",
    correo: "",
    busqueda: "",
    solo_con_usuario: false,
    solo_credenciales_enviadas: false,
    solo_sin_usuario: false,
  })

  // Estados de archivos cargados
  const [microsoftUploaded, setMicrosoftUploaded] = useState(false)
  const [moodleUploaded, setMoodleUploaded] = useState(false)

  // Estados del Paso 3
  const [credencialesMicrosoft, setCredencialesMicrosoft] = useState<CredencialMicrosoft[]>([])
  const [archivoMicrosoft, setArchivoMicrosoft] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [enviandoWhatsApp, setEnviandoWhatsApp] = useState<number | null>(null)
  const [resumenEnvio, setResumenEnvio] = useState<any>(null)
  const [mostrarResumenComisiones, setMostrarResumenComisiones] = useState(false)
  const [resumenComisiones, setResumenComisiones] = useState<any>(null)
  const [mesResumen, setMesResumen] = useState(new Date().getMonth() + 1)
  const [anioResumen, setAnioResumen] = useState(new Date().getFullYear())
  const [editarCarnetProspecto, setEditarCarnetProspecto] = useState<ProspectoCarnetRow | null>(null)

  useEffect(() => {
    cargarProspectos()
    cargarEstadisticas()
  }, [])

  const cargarProspectos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, `${value}`)
      })

      // Usar el endpoint de datos crudos
      const response = await fetch(`${API_BASE_URL}/api/gen-credenciales/datos-crudos?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setProspectos(data.data)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los prospectos"
      })
    } finally {
      setLoading(false)
    }
  }

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/gen-credenciales/estadisticas`)
      const data = await response.json()
      if (data.success) {
        setEstadisticas(data.data)
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error)
    }
  }

  // Filtrar prospectos localmente basándose en filtros de estado
  const prospectosFiltrados = useMemo(() => {
    let filtered = prospectos

    if (filtros.solo_con_usuario) {
      filtered = filtered.filter(p => p.tiene_usuario === true)
    }

    if (filtros.solo_sin_usuario) {
      filtered = filtered.filter(p => !p.tiene_usuario)
    }

    if (filtros.solo_credenciales_enviadas) {
      filtered = filtered.filter(p => p.ya_enviado === true)
    }

    return filtered
  }, [prospectos, filtros.solo_con_usuario, filtros.solo_sin_usuario, filtros.solo_credenciales_enviadas])

  const generarCarnets = async () => {
    if (selectedIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selecciona al menos un estudiante"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/gen-credenciales/generar-carnets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospecto_ids: selectedIds })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Carnets generados",
          description: `Se generaron ${data.total} carnets exitosamente.`
        })
        await cargarProspectos()
        await cargarEstadisticas()
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al generar carnets"
      })
    } finally {
      setLoading(false)
    }
  }

  const descargarPlantillaMicrosoft = async () => {
    if (selectedIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selecciona estudiantes con carnet generado"
      })
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/gen-credenciales/plantilla-microsoft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospecto_ids: selectedIds })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `plantilla_microsoft_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()

        toast({
          title: "Plantilla descargada",
          description: "Procesa el archivo en Microsoft Admin Center"
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al descargar plantilla"
      })
    }
  }

  const descargarPlantillaMoodle = async () => {
    if (selectedIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selecciona estudiantes con carnet generado"
      })
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/gen-credenciales/plantilla-moodle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospecto_ids: selectedIds })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `plantilla_moodle_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()

        toast({
          title: "Plantilla descargada",
          description: "Procesa el archivo en Moodle"
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al descargar plantilla"
      })
    }
  }

  // Paso 3: Cargar CSV procesado de Microsoft
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setArchivoMicrosoft(file)
        procesarCSVMicrosoft(file)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "El archivo debe ser un CSV"
        })
      }
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setArchivoMicrosoft(file)
      procesarCSVMicrosoft(file)
    }
  }

  const procesarCSVMicrosoft = async (file: File) => {
    setLoading(true)
    try {
      // Validación básica del archivo
      if (!file) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se seleccionó ningún archivo"
        })
        setLoading(false)
        return
      }

      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        toast({
          variant: "destructive",
          title: "Error",
          description: "El archivo debe ser un CSV (.csv)"
        })
        setLoading(false)
        return
      }

      const formData = new FormData()
      formData.append("archivo", file)

      const response = await fetch(`${API_BASE_URL}/api/gen-credenciales/cargar-credenciales-microsoft`, {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (response.ok && data.success) {
        console.log("✅ CSV procesado exitosamente:", {
          total: data.total,
          credenciales_count: data.credenciales?.length || 0,
          credenciales: data.credenciales
        })
        
        // Verificar que hay credenciales
        if (!data.credenciales || data.credenciales.length === 0) {
          toast({
            variant: "destructive",
            title: "Advertencia",
            description: "El CSV se procesó pero no se encontraron credenciales válidas. Verifica que los prospectos existan en el sistema."
          })
          console.warn("⚠️ No se encontraron credenciales válidas:", data)
          setLoading(false)
          return
        }
        
        setCredencialesMicrosoft(data.credenciales || [])
        setMicrosoftUploaded(true)
        
        console.log("✅ Credenciales guardadas en estado:", data.credenciales?.length || 0)
        
        toast({
          title: "CSV procesado exitosamente",
          description: `Se encontraron ${data.total} credenciales. Revisa el resumen antes de enviar.`
        })
        
        // Mostrar advertencias si hay errores
        if (data.errores && data.errores.length > 0) {
          toast({
            variant: "default",
            title: "Advertencias",
            description: `${data.errores.length} registros no se pudieron procesar. Revisa la consola para más detalles.`
          })
          console.warn("Errores al procesar CSV:", data.errores)
        }
      } else {
        // Mostrar error detallado
        let errorMessage = data.message || "Error al procesar el CSV"
        
        if (data.errors) {
          const errorDetails = Object.values(data.errors).flat().join(", ")
          errorMessage += `: ${errorDetails}`
        }
        
        if (data.headers_encontrados) {
          console.error("Encabezados encontrados en el CSV:", data.headers_encontrados)
          errorMessage += "\n\nEncabezados encontrados: " + data.headers_encontrados.join(", ")
        }
        
        if (data.sugerencia) {
          errorMessage += "\n\n" + data.sugerencia
        }

        toast({
          variant: "destructive",
          title: "Error al procesar CSV",
          description: errorMessage,
          duration: 10000 // Mostrar por más tiempo
        })
        
        console.error("Error completo:", data)
      }
    } catch (error: any) {
      console.error("Error al procesar CSV:", error)
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: error.message || "Error al procesar el archivo CSV. Verifica tu conexión."
      })
    } finally {
      setLoading(false)
    }
  }

  const enviarCredenciales = async () => {
    if (credencialesMicrosoft.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay credenciales para enviar"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/gen-credenciales/enviar-credenciales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credenciales: credencialesMicrosoft })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResumenEnvio(data)
        toast({
          title: "Credenciales enviadas",
          description: `${data.enviados} de ${data.total} credenciales enviadas exitosamente. ${data.usuarios_creados} usuarios creados, ${data.usuarios_existentes} ya existían.`
        })
        
        // Resetear proceso
        setSelectedIds([])
        setCredencialesMicrosoft([])
        setArchivoMicrosoft(null)
        setMicrosoftUploaded(false)
        setCurrentStep(1)
        await cargarProspectos()
        await cargarEstadisticas()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Error al enviar credenciales"
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al enviar credenciales"
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedIds.length === prospectosFiltrados.length && prospectosFiltrados.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(prospectosFiltrados.map(p => p.id))
    }
  }

  const enviarCredencialesWhatsApp = async (cred: CredencialMicrosoft) => {
    if (!cred.telefono) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El estudiante no tiene teléfono registrado"
      })
      return
    }

    setEnviandoWhatsApp(cred.prospecto_id)
    try {
      const response = await fetch(`${API_BASE_URL}/api/gen-credenciales/enviar-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospecto_id: cred.prospecto_id,
          password_temporal: cred.password_temporal,
          correo_corporativo: cred.correo_corporativo
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Abrir WhatsApp en nueva ventana
        window.open(data.whatsapp_link, '_blank')
        
        toast({
          title: "Credenciales enviadas",
          description: `WhatsApp y correo enviados exitosamente. ${data.usuario_creado ? 'Usuario creado.' : 'Usuario ya existía.'}`
        })

        // Actualizar estado local
        setCredencialesMicrosoft(prev => 
          prev.map(c => c.prospecto_id === cred.prospecto_id 
            ? { ...c, ya_enviado: true, tiene_usuario: true, usuario_id: data.usuario_id }
            : c
          )
        )

        await cargarProspectos()
        await cargarEstadisticas()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Error al enviar por WhatsApp"
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al enviar credenciales por WhatsApp"
      })
    } finally {
      setEnviandoWhatsApp(null)
    }
  }

  const cargarResumenComisiones = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/gen-credenciales/resumen?mes=${mesResumen}&anio=${anioResumen}`)
      const data = await response.json()
      
      if (data.success) {
        setResumenComisiones(data)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Error al cargar resumen de comisiones"
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar resumen de comisiones"
      })
    }
  }

  useEffect(() => {
    if (mostrarResumenComisiones) {
      cargarResumenComisiones()
    }
  }, [mostrarResumenComisiones, mesResumen, anioResumen])

  return (
    <div className="space-y-6">
      {/* Botón para ver resumen de comisiones */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={() => setMostrarResumenComisiones(true)}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Ver Resumen de Comisiones
        </Button>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium items-center flex gap-2">
                <User className="w-4 h-4" />
                Total Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.total_pendientes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium items-center flex gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Con Carnet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{estadisticas.con_carnet}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium items-center flex gap-2">
                <AlertCircle className="w-4 h-4" />
                Sin Carnet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{estadisticas.sin_carnet}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium items-center flex gap-2">
                <UserCheck className="w-4 h-4" />
                Usuarios Creados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{estadisticas.usuarios_creados || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium items-center flex gap-2">
                <Mail className="w-4 h-4" />
                Credenciales Enviadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{estadisticas.credenciales_enviadas || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium items-center flex gap-2">
                <Send className="w-4 h-4" />
                Listos para Enviar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">{estadisticas.listos_para_enviar}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stepper */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors",
                    currentStep >= step.id 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-muted-foreground">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-6 h-6 text-muted-foreground mx-2" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Buscar</Label>
              <Input 
                placeholder="Nombre, correo, carnet..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
              />
            </div>
            <div>
              <Label>Fecha desde</Label>
              <Input 
                type="date"
                value={filtros.fecha_inicio_desde}
                onChange={(e) => setFiltros({...filtros, fecha_inicio_desde: e.target.value})}
              />
            </div>
            <div>
              <Label>Fecha hasta</Label>
              <Input 
                type="date"
                value={filtros.fecha_inicio_hasta}
                onChange={(e) => setFiltros({...filtros, fecha_inicio_hasta: e.target.value})}
              />
            </div>
          </div>
          
          {/* Filtros adicionales de estado */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Label className="text-sm font-semibold mb-3 block">Filtros de Estado de Usuario</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="solo_con_usuario"
                  checked={filtros.solo_con_usuario}
                  onCheckedChange={(checked) => setFiltros({
                    ...filtros, 
                    solo_con_usuario: !!checked,
                    solo_sin_usuario: false // Desmarcar el opuesto
                  })}
                />
                <Label htmlFor="solo_con_usuario" className="text-sm flex items-center gap-2 cursor-pointer">
                  <UserCheck className="w-4 h-4 text-green-600" />
                  Solo con usuario creado
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="solo_credenciales_enviadas"
                  checked={filtros.solo_credenciales_enviadas}
                  onCheckedChange={(checked) => setFiltros({
                    ...filtros, 
                    solo_credenciales_enviadas: !!checked
                  })}
                />
                <Label htmlFor="solo_credenciales_enviadas" className="text-sm flex items-center gap-2 cursor-pointer">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Solo con credenciales enviadas
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="solo_sin_usuario"
                  checked={filtros.solo_sin_usuario}
                  onCheckedChange={(checked) => setFiltros({
                    ...filtros, 
                    solo_sin_usuario: !!checked,
                    solo_con_usuario: false // Desmarcar el opuesto
                  })}
                />
                <Label htmlFor="solo_sin_usuario" className="text-sm flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4 text-gray-600" />
                  Solo sin usuario
                </Label>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button onClick={cargarProspectos}>Aplicar Filtros</Button>
            <Button 
              variant="outline" 
              onClick={() => setFiltros({
                fecha_inicio_desde: "",
                fecha_inicio_hasta: "",
                programa_id: "",
                correo: "",
                busqueda: "",
                solo_con_usuario: false,
                solo_credenciales_enviadas: false,
                solo_sin_usuario: false,
              })}
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Paso 1: Seleccionar y generar carnets */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 1: Seleccionar Estudiantes y Generar Carnets</CardTitle>
            <CardDescription>
              Selecciona los estudiantes y genera sus carnets. La tabla muestra todos los datos relevantes de la ficha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {selectedIds.length} de {prospectosFiltrados.length} seleccionados ({prospectos.length} total)
                </div>
                <Button 
                  onClick={generarCarnets}
                  disabled={selectedIds.length === 0 || loading}
                >
                  <IdCard className="w-4 h-4 mr-2" />
                  Generar Carnets
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={selectedIds.length === prospectosFiltrados.length && prospectosFiltrados.length > 0}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead>Estado Usuario</TableHead>
                      <TableHead>Carnet</TableHead>
                      <TableHead>Día 1</TableHead>
                      <TableHead>Día 2</TableHead>
                      <TableHead>Día 3</TableHead>
                      <TableHead>Mes de Ingreso</TableHead>
                      <TableHead>Inscripción</TableHead>
                      <TableHead>Monto Mensualidad</TableHead>
                      <TableHead>Nombres</TableHead>
                      <TableHead>Apellidos</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Programa</TableHead>
                      <TableHead>Asesor</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prospectosFiltrados.map((prospecto) => {
                      // Determinar si ya tiene usuario creado
                      const tieneUsuario = prospecto.tiene_usuario || false
                      const yaEnviado = prospecto.ya_enviado || false
                      
                      return (
                      <TableRow key={prospecto.id} className={yaEnviado ? "bg-green-50" : ""}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedIds.includes(prospecto.id)}
                            onCheckedChange={() => toggleSelection(prospecto.id)}
                          />
                        </TableCell>
                        <TableCell>
                          {tieneUsuario ? (
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Usuario Creado
                              </Badge>
                              {yaEnviado && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Credenciales Enviadas
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                              <User className="w-3 h-3 mr-1" />
                              Sin Usuario
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {prospecto.carnet ? (
                            <Badge variant="secondary">{prospecto.carnet}</Badge>
                          ) : (
                            <Badge variant="outline">Sin asignar</Badge>
                          )}
                        </TableCell>
                        <TableCell>{prospecto.dia_1 || '-'}</TableCell>
                        <TableCell>{prospecto.dia_2 || '-'}</TableCell>
                        <TableCell>{prospecto.dia_3 || '-'}</TableCell>
                        <TableCell>{prospecto.mes_ingreso || '-'}</TableCell>
                        <TableCell>Q{formatNumber(prospecto.inscripcion)}</TableCell>
                        <TableCell>{prospecto.mensualidad || '-'}</TableCell>
                        <TableCell className="font-medium">{prospecto.nombres}</TableCell>
                        <TableCell>{prospecto.apellidos}</TableCell>
                        <TableCell>{prospecto.telefono || '-'}</TableCell>
                        <TableCell>{prospecto.email || '-'}</TableCell>
                        <TableCell>
                          {prospecto.programa ? (
                            <Badge variant="outline">{prospecto.programa}</Badge>
                          ) : 'Sin programa'}
                        </TableCell>
                        <TableCell>{prospecto.asesor || 'Sin asignar'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setEditarCarnetProspecto({
                                id: prospecto.id,
                                nombre_completo: prospecto.nombre_completo || `${prospecto.nombres} ${prospecto.apellidos}`.trim() || 'Estudiante',
                                carnet: prospecto.carnet || '',
                              })
                            }
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar Carnet
                          </Button>
                        </TableCell>
                      </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => setCurrentStep(2)}
                  disabled={selectedIds.length === 0 || !prospectos.some(p => selectedIds.includes(p.id) && p.tiene_carnet)}
                >
                  Continuar a Descargar Plantillas
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paso 2: Descargar Plantillas */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 2: Descargar Plantillas Procesadas</CardTitle>
            <CardDescription>
              Descarga las plantillas CSV para procesarlas en Microsoft 365 y Moodle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Microsoft 365</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button onClick={descargarPlantillaMicrosoft} variant="outline" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar CSV Microsoft
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        Procesa este archivo en Microsoft Admin Center y luego carga el CSV procesado en el Paso 3.
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Moodle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button onClick={descargarPlantillaMoodle} variant="outline" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar CSV Moodle
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        Importa este archivo en Moodle. No requiere carga posterior.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Volver
                </Button>
                <Button 
                  onClick={() => setCurrentStep(3)}
                >
                  Continuar a Cargar CSV Procesado
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paso 3: Cargar CSV Procesado y Enviar Credenciales */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 3: Cargar CSV Procesado de Microsoft y Enviar Credenciales</CardTitle>
            <CardDescription>
              Carga el CSV que Microsoft 365 devolvió después de procesar la plantilla. Este archivo contiene las credenciales generadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Área de carga */}
              <div>
                <Label className="text-base font-semibold mb-2 block">CSV Procesado de Microsoft 365</Label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                    dragActive 
                      ? "border-primary bg-primary/5" 
                      : archivoMicrosoft
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300 hover:border-gray-400"
                  )}
                >
                  {archivoMicrosoft ? (
                    <div className="space-y-2">
                      <FileText className="w-12 h-12 mx-auto text-green-600" />
                      <div className="font-medium">{archivoMicrosoft.name}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setArchivoMicrosoft(null)
                          setCredencialesMicrosoft([])
                          setMicrosoftUploaded(false)
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remover archivo
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <div className="text-sm text-muted-foreground mb-2">
                        Arrastra el CSV aquí o haz clic para seleccionar
                      </div>
                      <Input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        id="csv-upload"
                        onChange={handleFileChange}
                      />
                      <Label htmlFor="csv-upload">
                        <Button variant="outline" asChild>
                          <span>Seleccionar archivo</span>
                        </Button>
                      </Label>
                    </>
                  )}
                </div>
              </div>

              {/* Tabla resumen de credenciales */}
              {credencialesMicrosoft.length > 0 ? (
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Resumen de Credenciales ({credencialesMicrosoft.length} encontradas)
                  </Label>
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800">
                      <strong>📋 Preview antes de enviar:</strong> Revisa la información de cada estudiante. 
                      Puedes enviar individualmente por WhatsApp o masivamente por correo. 
                      Las credenciales incluyen: Sistema Interno, Moodle y Microsoft 365.
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Carnet</TableHead>
                          <TableHead>Asesor</TableHead>
                          <TableHead>Correo Corporativo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {credencialesMicrosoft.map((cred, index) => (
                          <TableRow key={index} className={cred.ya_enviado ? "bg-yellow-50" : ""}>
                            <TableCell className="font-medium">{cred.nombre_completo}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{cred.carnet}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {cred.asesor_nombre || 'Sin asignar'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{cred.correo_corporativo}</div>
                              <div className="text-xs text-muted-foreground">{cred.correo_electronico}</div>
                            </TableCell>
                            <TableCell>
                              {cred.ya_enviado ? (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Ya enviado
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-100 text-green-800">
                                  Pendiente
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {cred.tiene_usuario ? (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Existe
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                  <User className="w-3 h-3 mr-1" />
                                  Crear
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {cred.telefono && !cred.ya_enviado && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => enviarCredencialesWhatsApp(cred)}
                                    disabled={enviandoWhatsApp === cred.prospecto_id}
                                  >
                                    <MessageCircle className="w-4 h-4 mr-1" />
                                    WhatsApp
                                  </Button>
                                )}
                                {cred.ya_enviado && (
                                  <div className="text-xs text-muted-foreground flex items-center">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Ya enviado
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Resumen de estadísticas */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Total</div>
                        <div className="text-2xl font-bold">{credencialesMicrosoft.length}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Pendientes</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {credencialesMicrosoft.filter(c => !c.ya_enviado).length}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Con Usuario</div>
                        <div className="text-2xl font-bold text-green-600">
                          {credencialesMicrosoft.filter(c => c.tiene_usuario).length}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Ya Enviados</div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {credencialesMicrosoft.filter(c => c.ya_enviado).length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : microsoftUploaded && credencialesMicrosoft.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    <strong>⚠️ Advertencia:</strong> El CSV se cargó pero no se encontraron credenciales válidas.
                    <br />
                    Verifica que:
                    <ul className="list-disc list-inside mt-2">
                      <li>Los prospectos existan en el sistema con el carnet correspondiente</li>
                      <li>El CSV tenga datos en las filas (no solo encabezados)</li>
                      <li>Los nombres de usuario coincidan con los carnets de los prospectos</li>
                    </ul>
                  </div>
                </div>
              ) : null}

              {/* Botones de acción */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Volver
                </Button>
                <div className="flex gap-2">
                <Button 
                  onClick={enviarCredenciales}
                  disabled={credencialesMicrosoft.length === 0 || loading || credencialesMicrosoft.every(c => c.ya_enviado)}
                  variant="default"
                  title={
                    credencialesMicrosoft.length === 0 
                      ? "No hay credenciales para enviar" 
                      : credencialesMicrosoft.every(c => c.ya_enviado)
                      ? "Todas las credenciales ya fueron enviadas"
                      : `Enviar ${credencialesMicrosoft.filter(c => !c.ya_enviado).length} credenciales`
                  }
                >
                  <Send className="w-4 h-4 mr-2" />
                  {credencialesMicrosoft.length === 0 
                    ? "No hay credenciales" 
                    : credencialesMicrosoft.every(c => c.ya_enviado)
                    ? "Todas enviadas"
                    : `Enviar ${credencialesMicrosoft.filter(c => !c.ya_enviado).length} Credenciales`}
                </Button>
                </div>
              </div>

              {/* Resumen después del envío */}
              {resumenEnvio && (
                <Card className="mt-6 border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-800">✅ Proceso Completado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Enviados</div>
                          <div className="text-2xl font-bold text-green-600">{resumenEnvio.enviados}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Usuarios Creados</div>
                          <div className="text-2xl font-bold text-blue-600">{resumenEnvio.usuarios_creados || 0}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Usuarios Existentes</div>
                          <div className="text-2xl font-bold text-orange-600">{resumenEnvio.usuarios_existentes || 0}</div>
                        </div>
                      </div>
                      {resumenEnvio.errores && resumenEnvio.errores.length > 0 && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="text-sm font-semibold text-red-800 mb-2">Errores:</div>
                          <ul className="text-sm text-red-700 list-disc list-inside">
                            {resumenEnvio.errores.map((error: string, idx: number) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog para resumen de comisiones */}
      <Dialog open={mostrarResumenComisiones} onOpenChange={setMostrarResumenComisiones}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resumen de Comisiones por Mes</DialogTitle>
            <DialogDescription>
              Tabla de inscritos y comisiones generadas por asesor
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Filtros de mes y año */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mes</Label>
                <Select value={mesResumen.toString()} onValueChange={(v) => setMesResumen(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <SelectItem key={m} value={m.toString()}>
                        {new Date(2000, m-1).toLocaleString('es', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Año</Label>
                <Input
                  type="number"
                  value={anioResumen}
                  onChange={(e) => setAnioResumen(parseInt(e.target.value))}
                  min={2020}
                  max={2030}
                />
              </div>
            </div>

            {/* Tabla de resumen */}
            {resumenComisiones && (
              <div>
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm font-semibold">Total Inscritos: {resumenComisiones.total_inscritos}</div>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asesor</TableHead>
                        <TableHead>Inscritos</TableHead>
                        <TableHead>Monto Total</TableHead>
                        <TableHead>Comisión</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resumenComisiones.por_asesor && resumenComisiones.por_asesor.length > 0 ? (
                        resumenComisiones.por_asesor.map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.asesor_nombre}</TableCell>
                            <TableCell>{item.total_inscritos}</TableCell>
                            <TableCell>Q{formatNumber(item.monto_total)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">Q{formatNumber(item.comision)}</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No hay datos para este mes
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ModalEditarCarnetProspecto
        open={!!editarCarnetProspecto}
        onClose={() => setEditarCarnetProspecto(null)}
        prospecto={
          editarCarnetProspecto ?? {
            id: 0,
            nombre_completo: "",
            carnet: "",
          }
        }
        onSuccess={cargarProspectos}
      />
    </div>
  )
}
