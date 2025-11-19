"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Swal from "sweetalert2"
import { API_BASE_URL } from "@/utils/apiConfig"

interface ProspectoCompleto {
  id: string
  nombre_completo: string
  telefono: string | null
  correo_electronico: string | null
  genero: string
  empresa_donde_labora_actualmente: string | null
  puesto: string | null
  notas_generales: string | null
  observaciones: string | null
  interes: string | null
  status: string
  medio_conocimiento_institucion: string | null
  pais_nombre: string | null
  departamento_nombre: string | null
  municipio_nombre: string | null
}

interface EditarProspectoCompletoProps {
  prospectoId: string
  onClose: () => void
  onUpdate?: () => void
}

const API_URL = `${API_BASE_URL}/api`

export default function EditarProspectoCompleto({ prospectoId, onClose, onUpdate }: EditarProspectoCompletoProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [programas, setProgramas] = useState<any[]>([])
  
  // Estados del formulario
  const [formData, setFormData] = useState<ProspectoCompleto>({
    id: "",
    nombre_completo: "",
    telefono: "",
    correo_electronico: "",
    genero: "",
    empresa_donde_labora_actualmente: "",
    puesto: "",
    notas_generales: "",
    observaciones: "",
    interes: "",
    status: "",
    medio_conocimiento_institucion: "",
    pais_nombre: "",
    departamento_nombre: "",
    municipio_nombre: "",
  })

  // Cargar datos del prospecto
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        
        // Cargar prospecto
        const resProspecto = await fetch(`${API_URL}/prospectos/${prospectoId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        
        if (!resProspecto.ok) throw new Error("Error al cargar prospecto")
        
        const { data } = await resProspecto.json()
        
        setFormData({
          id: data.id,
          nombre_completo: data.nombre_completo || "",
          telefono: data.telefono || "",
          correo_electronico: data.correo_electronico || "",
          genero: data.genero || "",
          empresa_donde_labora_actualmente: data.empresa_donde_labora_actualmente || "",
          puesto: data.puesto || "",
          notas_generales: data.notas_generales || "",
          observaciones: data.observaciones || "",
          interes: data.interes || "",
          status: data.status || "",
          medio_conocimiento_institucion: data.medio_conocimiento_institucion || "",
          pais_nombre: data.pais_nombre || "",
          departamento_nombre: data.departamento_nombre || "",
          municipio_nombre: data.municipio_nombre || "",
        })
        
        // Cargar programas
        const resProgramas = await fetch(`${API_URL}/programas`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        
        if (resProgramas.ok) {
          const programasData = await resProgramas.json()
          setProgramas(programasData)
        }
        
      } catch (err: any) {
        console.error("❌ Error cargando datos:", err)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los datos del prospecto",
        })
      } finally {
        setLoadingData(false)
      }
    }
    
    fetchData()
  }, [prospectoId])

  const handleChange = (field: keyof ProspectoCompleto, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      
      const payload = {
        nombreCompleto: formData.nombre_completo,
        telefono: formData.telefono || null,
        correoElectronico: formData.correo_electronico || null,
        genero: formData.genero,
        empresaDondeLaboraActualmente: formData.empresa_donde_labora_actualmente || null,
        puesto: formData.puesto || null,
        notasGenerales: formData.notas_generales || null,
        observaciones: formData.observaciones || null,
        interes: formData.interes || null,
        status: formData.status,
        medio_conocimiento_institucion: formData.medio_conocimiento_institucion || null,
      }
      
      const res = await fetch(`${API_URL}/prospectos/${prospectoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      
      const body = await res.json()
      
      if (!res.ok) {
        const errorMsg = body.messages?.correoElectronico?.[0] || body.message || `Error ${res.status}`
        throw new Error(errorMsg)
      }
      
      // Invalidar cachés
      localStorage.removeItem("gestion_prospectos_cache")
      localStorage.removeItem("gestion_prospectos_cache_time")
      localStorage.removeItem("seguimiento_prospectos_cache")
      localStorage.removeItem("seguimiento_prospectos_cache_time")
      
      onClose()
      
      if (onUpdate) {
        onUpdate()
      }
      
      await Swal.fire({
        icon: "success",
        title: "¡Actualizado!",
        text: "El prospecto ha sido actualizado exitosamente",
        timer: 2000,
        showConfirmButton: false
      })
      
    } catch (err: any) {
      console.error("❌ Error actualizando:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo actualizar el prospecto",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Editar Prospecto - ID: {formData.id}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basicos" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basicos">Datos Básicos</TabsTrigger>
                <TabsTrigger value="profesional">Profesional</TabsTrigger>
                <TabsTrigger value="notas">Notas</TabsTrigger>
              </TabsList>

              {/* Tab 1: Datos Básicos */}
              <TabsContent value="basicos" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nombre Completo <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.nombre_completo}
                      onChange={(e) => handleChange("nombre_completo", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Género</label>
                    <Select value={formData.genero} onValueChange={(v) => handleChange("genero", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Teléfono <span className="text-xs text-gray-500">(Opcional si hay correo)</span>
                    </label>
                    <Input
                      value={formData.telefono || ""}
                      onChange={(e) => handleChange("telefono", e.target.value)}
                      placeholder="Mínimo 8 dígitos"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Correo Electrónico <span className="text-xs text-gray-500">(Opcional si hay teléfono)</span>
                    </label>
                    <Input
                      type="email"
                      value={formData.correo_electronico || ""}
                      onChange={(e) => handleChange("correo_electronico", e.target.value)}
                      placeholder="ejemplo@correo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Estado</label>
                    <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="No contactado">No contactado</SelectItem>
                        <SelectItem value="En seguimiento">En seguimiento</SelectItem>
                        <SelectItem value="Le interesa a futuro">Le interesa a futuro</SelectItem>
                        <SelectItem value="Perdido">Perdido</SelectItem>
                        <SelectItem value="Inscrito">Inscrito</SelectItem>
                        <SelectItem value="Promesa de pago">Promesa de pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Medio de Conocimiento</label>
                    <Select 
                      value={formData.medio_conocimiento_institucion || ""} 
                      onValueChange={(v) => handleChange("medio_conocimiento_institucion", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione origen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Facebook">Facebook</SelectItem>
                        <SelectItem value="Instagram">Instagram</SelectItem>
                        <SelectItem value="Google">Google</SelectItem>
                        <SelectItem value="Referido">Referido</SelectItem>
                        <SelectItem value="Llamada telefónica">Llamada telefónica</SelectItem>
                        <SelectItem value="Visita presencial">Visita presencial</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 text-sm text-gray-700">Ubicación</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">País</label>
                      <Input
                        value={formData.pais_nombre || ""}
                        onChange={(e) => handleChange("pais_nombre", e.target.value)}
                        placeholder="Ej: Guatemala"
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Departamento</label>
                      <Input
                        value={formData.departamento_nombre || ""}
                        onChange={(e) => handleChange("departamento_nombre", e.target.value)}
                        placeholder="Ej: Guatemala"
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Municipio</label>
                      <Input
                        value={formData.municipio_nombre || ""}
                        onChange={(e) => handleChange("municipio_nombre", e.target.value)}
                        placeholder="Ej: Guatemala"
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * La ubicación se establece en la captura inicial y no se puede editar
                  </p>
                </div>
              </TabsContent>

              {/* Tab 2: Información Profesional */}
              <TabsContent value="profesional" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Empresa Actual</label>
                    <Input
                      value={formData.empresa_donde_labora_actualmente || ""}
                      onChange={(e) => handleChange("empresa_donde_labora_actualmente", e.target.value)}
                      placeholder="Nombre de la empresa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Puesto</label>
                    <Input
                      value={formData.puesto || ""}
                      onChange={(e) => handleChange("puesto", e.target.value)}
                      placeholder="Cargo o puesto"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Programa de Interés</label>
                    <Select 
                      value={formData.interes || "sin_programa"} 
                      onValueChange={(v) => handleChange("interes", v === "sin_programa" ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un programa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sin_programa">Sin programa</SelectItem>
                        {programas.map((prog) => (
                          <SelectItem key={prog.id} value={String(prog.id)}>
                            {prog.nombre_del_programa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Notas */}
              <TabsContent value="notas" className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Notas Generales</label>
                  <Textarea
                    value={formData.notas_generales || ""}
                    onChange={(e) => handleChange("notas_generales", e.target.value)}
                    placeholder="Información general del prospecto..."
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Observaciones</label>
                  <Textarea
                    value={formData.observaciones || ""}
                    onChange={(e) => handleChange("observaciones", e.target.value)}
                    placeholder="Observaciones específicas, seguimientos, etc..."
                    rows={4}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
