"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
  X
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

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
  password_temporal: string
  username: string
  display_name: string
}

interface Estadisticas {
  total_pendientes: number
  con_carnet: number
  sin_carnet: number
  listos_para_enviar: number
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
    busqueda: ""
  })

  // Estados de archivos cargados
  const [microsoftUploaded, setMicrosoftUploaded] = useState(false)
  const [moodleUploaded, setMoodleUploaded] = useState(false)

  // Estados del Paso 3
  const [credencialesMicrosoft, setCredencialesMicrosoft] = useState<CredencialMicrosoft[]>([])
  const [archivoMicrosoft, setArchivoMicrosoft] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    cargarProspectos()
    cargarEstadisticas()
  }, [])

  const cargarProspectos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      // Usar el endpoint de datos crudos
      const response = await fetch(`http://localhost:8000/api/gen-credenciales/datos-crudos?${params}`)
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
      const response = await fetch("http://localhost:8000/api/gen-credenciales/estadisticas")
      const data = await response.json()
      if (data.success) {
        setEstadisticas(data.data)
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error)
    }
  }

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
      const response = await fetch("http://localhost:8000/api/gen-credenciales/generar-carnets", {
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
      const response = await fetch("http://localhost:8000/api/gen-credenciales/plantilla-microsoft", {
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
      const response = await fetch("http://localhost:8000/api/gen-credenciales/plantilla-moodle", {
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
      const formData = new FormData()
      formData.append("archivo", file)

      const response = await fetch("http://localhost:8000/api/gen-credenciales/cargar-credenciales-microsoft", {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setCredencialesMicrosoft(data.credenciales)
        setMicrosoftUploaded(true)
        toast({
          title: "CSV procesado",
          description: `Se encontraron ${data.total} credenciales. Revisa el resumen antes de enviar.`
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Error al procesar el CSV"
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al procesar el archivo CSV"
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
      const response = await fetch("http://localhost:8000/api/gen-credenciales/enviar-credenciales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credenciales: credencialesMicrosoft })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Credenciales enviadas",
          description: `${data.enviados} de ${data.total} credenciales enviadas exitosamente`
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
    if (selectedIds.length === prospectos.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(prospectos.map(p => p.id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.total_pendientes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Con Carnet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{estadisticas.con_carnet}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Sin Carnet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{estadisticas.sin_carnet}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Listos para Enviar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{estadisticas.listos_para_enviar}</div>
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
          <div className="mt-4">
            <Button onClick={cargarProspectos}>Aplicar Filtros</Button>
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
                  {selectedIds.length} de {prospectos.length} seleccionados
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
                          checked={selectedIds.length === prospectos.length && prospectos.length > 0}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prospectos.map((prospecto) => (
                      <TableRow key={prospecto.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedIds.includes(prospecto.id)}
                            onCheckedChange={() => toggleSelection(prospecto.id)}
                          />
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
                      </TableRow>
                    ))}
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
              {credencialesMicrosoft.length > 0 && (
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Resumen de Credenciales ({credencialesMicrosoft.length} encontradas)
                  </Label>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Correo</TableHead>
                          <TableHead>Carnet</TableHead>
                          <TableHead>Correo Corporativo</TableHead>
                          <TableHead>Contraseña Temporal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {credencialesMicrosoft.map((cred, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{cred.nombre_completo}</TableCell>
                            <TableCell>{cred.correo_electronico}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{cred.carnet}</Badge>
                            </TableCell>
                            <TableCell>{cred.correo_corporativo}</TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">{cred.password_temporal}</code>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Volver
                </Button>
                <Button 
                  onClick={enviarCredenciales}
                  disabled={credencialesMicrosoft.length === 0 || loading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Generar y Enviar Credenciales
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
