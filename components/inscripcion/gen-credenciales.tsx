"use client"

import { useState, useEffect } from "react"
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
  Mail
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Prospecto {
  id: number
  nombre_completo: string
  correo_electronico: string
  telefono: string
  carnet: string | null
  fecha_inicio_especifica: string
  datos_completos: boolean
  tiene_carnet: boolean
  campos_faltantes: string[]
  programas: Array<{
    duracion_meses: number | null
    programa: {
      nombre_del_programa: string
      abreviatura: string
    }
  }>
}

interface Estadisticas {
  total_pendientes: number
  con_carnet: number
  sin_carnet: number
  listos_para_enviar: number
}

const steps = [
  { id: 1, title: "Generar Carnets y Plantillas", icon: CheckCircle2, description: "Carnets y descarga MS/Moodle" },
  { id: 2, title: "Enviar Credenciales", icon: Mail, description: "Cargar plantillas y enviar" },
]

export function GeneracionCredenciales() {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [prospectos, setProspectos] = useState<Prospecto[]>([])
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

      const response = await fetch(`http://localhost:8000/api/gen-credenciales?${params}`)
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
          description: `Se generaron ${data.total} carnets exitosamente. Descargando plantillas...`
        })
        await cargarProspectos()
        await cargarEstadisticas()
        
        // Descargar automáticamente ambas plantillas
        await descargarPlantillaMicrosoft()
        await descargarPlantillaMoodle()
        
        toast({
          title: "Plantillas descargadas",
          description: "Procesa ambos archivos CSV y cárgalos en el siguiente paso"
        })
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
          description: "Procesa el archivo y súbelo nuevamente"
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
          description: "Importa el archivo en Moodle y súbelo aquí"
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

  const cargarPlantillaMicrosoft = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("archivo", file)

    setLoading(true)
    try {
      const response = await fetch("http://localhost:8000/api/gen-credenciales/cargar-microsoft", {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setMicrosoftUploaded(true)
        toast({
          title: "Plantilla Microsoft procesada",
          description: `${data.actualizados} registros actualizados`
        })
        await cargarProspectos()
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al procesar plantilla Microsoft"
      })
    } finally {
      setLoading(false)
    }
  }

  const cargarPlantillaMoodle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("archivo", file)

    setLoading(true)
    try {
      const response = await fetch("http://localhost:8000/api/gen-credenciales/cargar-moodle", {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setMoodleUploaded(true)
        toast({
          title: "Plantilla Moodle procesada",
          description: `${data.actualizados} registros actualizados`
        })
        await cargarProspectos()
        setCurrentStep(2)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al procesar plantilla Moodle"
      })
    } finally {
      setLoading(false)
    }
  }

  const generarYEnviarCredenciales = async () => {
    // Validar que todos los seleccionados tengan datos completos
    const incompletos = prospectos.filter(p => 
      selectedIds.includes(p.id) && !p.datos_completos
    )

    if (incompletos.length > 0) {
      toast({
        variant: "destructive",
        title: "Datos incompletos",
        description: `${incompletos.length} estudiantes tienen datos incompletos`
      })
      return
    }

    if (!microsoftUploaded || !moodleUploaded) {
      toast({
        variant: "destructive",
        title: "Plantillas pendientes",
        description: "Debes cargar ambas plantillas procesadas antes de continuar"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("http://localhost:8000/api/gen-credenciales/generar-enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospecto_ids: selectedIds })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Credenciales enviadas",
          description: `${data.enviados} de ${data.total} credenciales enviadas exitosamente`
        })
        
        // Resetear proceso
        setSelectedIds([])
        setMicrosoftUploaded(false)
        setMoodleUploaded(false)
        setCurrentStep(1)
        await cargarProspectos()
        await cargarEstadisticas()
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
              Selecciona los estudiantes y genera sus carnets antes de continuar
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

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedIds.length === prospectos.length && prospectos.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Programa</TableHead>
                    <TableHead>Carnet</TableHead>
                    <TableHead>Estado</TableHead>
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
                      <TableCell className="font-medium">{prospecto.nombre_completo}</TableCell>
                      <TableCell>{prospecto.correo_electronico}</TableCell>
                      <TableCell>
                        {prospecto.programas[0] ? (
                          <Badge variant="outline">
                            {prospecto.programas[0].programa?.abreviatura || 'Sin abrev.'}
                            {prospecto.programas[0].duracion_meses ? `-${prospecto.programas[0].duracion_meses}` : ''}
                          </Badge>
                        ) : 'Sin programa'}
                      </TableCell>
                      <TableCell>
                        {prospecto.carnet ? (
                          <Badge variant="secondary">{prospecto.carnet}</Badge>
                        ) : (
                          <Badge variant="outline">Sin asignar</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {prospecto.tiene_carnet && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                          {prospecto.campos_faltantes.includes('correo_electronico') && <span title="Sin email"><AlertCircle className="w-4 h-4 text-red-600" /></span>}
                          {prospecto.campos_faltantes.includes('telefono') && <span title="Sin teléfono"><AlertCircle className="w-4 h-4 text-orange-600" /></span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end">
                <Button 
                  onClick={() => setCurrentStep(2)}
                  disabled={selectedIds.length === 0 || !prospectos.every(p => selectedIds.includes(p.id) ? p.tiene_carnet : true)}
                >
                  Continuar a Cargar Plantillas
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paso 2: Cargar Plantillas y Enviar */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Paso 2: Cargar Plantillas Procesadas y Enviar Credenciales</CardTitle>
            <CardDescription>
              Las plantillas ya fueron descargadas. Procésalas en sus respectivas plataformas y cárgalas aquí
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
                        Re-descargar CSV Microsoft
                      </Button>
                      <Label htmlFor="microsoft-upload" className="cursor-pointer">
                        <div className={cn(
                          "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
                          microsoftUploaded ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400"
                        )}>
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <div className="text-sm">
                            {microsoftUploaded ? "✓ Plantilla MS cargada" : "Click para cargar CSV procesado"}
                          </div>
                        </div>
                      </Label>
                      <Input 
                        id="microsoft-upload"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={cargarPlantillaMicrosoft}
                      />
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
                        Re-descargar CSV Moodle
                      </Button>
                      <Label htmlFor="moodle-upload" className="cursor-pointer">
                        <div className={cn(
                          "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
                          moodleUploaded ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400"
                        )}>
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <div className="text-sm">
                            {moodleUploaded ? "✓ Plantilla Moodle cargada" : "Click para cargar CSV procesado"}
                          </div>
                        </div>
                      </Label>
                      <Input 
                        id="moodle-upload"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={cargarPlantillaMoodle}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Volver
                </Button>
                <Button 
                  onClick={generarYEnviarCredenciales}
                  disabled={!microsoftUploaded || !moodleUploaded || loading}
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
