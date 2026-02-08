"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Plus, Edit, Trash2, Save, X, DollarSign, CheckCircle, XCircle, AlertCircle, HelpCircle } from "lucide-react"
import { API_BASE_URL } from "@/utils/apiConfig"
import axios from "axios"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PrecioServicio {
  id: number
  cantidad_cursos: number
  precio_transferencia: number
  precio_otro_metodo: number
  activo: boolean
  created_at: string
  updated_at: string
}

export default function PreciosServiciosElectronicos() {
  const { toast } = useToast()
  const [precios, setPrecios] = useState<PrecioServicio[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    cantidad_cursos: "",
    precio_transferencia: "",
    precio_otro_metodo: "",
  })
  const [showNewForm, setShowNewForm] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: number; activo: boolean } | null>(null)

  useEffect(() => {
    cargarPrecios()
  }, [])

  const cargarPrecios = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await axios.get(`${API_BASE_URL}/api/precios-servicios-electronicos`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setPrecios(response.data)
    } catch (error) {
      console.error("Error cargando precios:", error)
      toast({
        variant: "destructive",
        title: "Error al cargar precios",
        description: "No se pudieron cargar los precios. Intente nuevamente.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem("access_token")
      await axios.post(
        `${API_BASE_URL}/api/precios-servicios-electronicos`,
        {
          cantidad_cursos: parseInt(formData.cantidad_cursos),
          precio_transferencia: parseFloat(formData.precio_transferencia),
          precio_otro_metodo: parseFloat(formData.precio_otro_metodo),
          activo: true,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      toast({
        title: "✅ Precio creado exitosamente",
        description: `Precio para ${formData.cantidad_cursos} cursos creado correctamente.`,
        className: "bg-green-50 border-green-200",
      })
      setShowNewForm(false)
      setFormData({ cantidad_cursos: "", precio_transferencia: "", precio_otro_metodo: "" })
      cargarPrecios()
    } catch (error: any) {
      console.error("Error creando precio:", error)
      toast({
        variant: "destructive",
        title: "❌ Error al crear precio",
        description: error.response?.data?.message || "No se pudo crear el precio. Verifique los datos e intente nuevamente.",
      })
    }
  }

  const handleUpdate = async (id: number) => {
    try {
      const token = localStorage.getItem("access_token")
      await axios.put(
        `${API_BASE_URL}/api/precios-servicios-electronicos/${id}`,
        {
          cantidad_cursos: parseInt(formData.cantidad_cursos),
          precio_transferencia: parseFloat(formData.precio_transferencia),
          precio_otro_metodo: parseFloat(formData.precio_otro_metodo),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      toast({
        title: "✅ Precio actualizado exitosamente",
        description: `Los cambios han sido guardados correctamente.`,
        className: "bg-green-50 border-green-200",
      })
      setEditingId(null)
      setFormData({ cantidad_cursos: "", precio_transferencia: "", precio_otro_metodo: "" })
      cargarPrecios()
    } catch (error: any) {
      console.error("Error actualizando precio:", error)
      toast({
        variant: "destructive",
        title: "❌ Error al actualizar precio",
        description: error.response?.data?.message || "No se pudo actualizar el precio. Intente nuevamente.",
      })
    }
  }

  const handleToggleActivo = async (id: number, activo: boolean) => {
    try {
      const token = localStorage.getItem("access_token")
      if (activo) {
        await axios.delete(`${API_BASE_URL}/api/precios-servicios-electronicos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast({
          title: "✅ Precio desactivado",
          description: "El precio ha sido marcado como inactivo.",
          className: "bg-orange-50 border-orange-200",
        })
      } else {
        await axios.post(
          `${API_BASE_URL}/api/precios-servicios-electronicos/${id}/activar`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        toast({
          title: "✅ Precio activado",
          description: "El precio ha sido activado exitosamente.",
          className: "bg-green-50 border-green-200",
        })
      }
      cargarPrecios()
    } catch (error) {
      console.error("Error cambiando estado:", error)
      toast({
        variant: "destructive",
        title: "❌ Error al cambiar estado",
        description: "No se pudo cambiar el estado del precio. Intente nuevamente.",
      })
    }
  }

  const confirmToggleActivo = (id: number, activo: boolean) => {
    setItemToDelete({ id, activo })
    setDeleteDialogOpen(true)
  }

  const executeToggleActivo = () => {
    if (itemToDelete) {
      handleToggleActivo(itemToDelete.id, itemToDelete.activo)
    }
    setDeleteDialogOpen(false)
    setItemToDelete(null)
  }

  const startEdit = (precio: PrecioServicio) => {
    setEditingId(precio.id)
    setFormData({
      cantidad_cursos: precio.cantidad_cursos.toString(),
      precio_transferencia: precio.precio_transferencia.toString(),
      precio_otro_metodo: precio.precio_otro_metodo.toString(),
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setShowNewForm(false)
    setFormData({ cantidad_cursos: "", precio_transferencia: "", precio_otro_metodo: "" })
  }

  const calcularPrecioOtroMetodo = (precioTransfer: string) => {
    const precio = parseFloat(precioTransfer)
    if (!isNaN(precio)) {
      return (precio * 1.1).toFixed(2)
    }
    return ""
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-6 w-6" />
                Precios de Servicios Electrónicos
              </CardTitle>
              <CardDescription>
                Configure los precios de servicios electrónicos según la cantidad de cursos
              </CardDescription>
            </div>
            <Button onClick={() => setShowNewForm(true)} disabled={showNewForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Precio
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {showNewForm && (
            <Card className="mb-6 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">Nuevo Precio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="new-cursos">Cantidad de Cursos</Label>
                    <Input
                      id="new-cursos"
                      type="number"
                      value={formData.cantidad_cursos}
                      onChange={(e) => setFormData({ ...formData, cantidad_cursos: e.target.value })}
                      placeholder="8, 9, 12, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-transfer">Precio Transferencia (Q)</Label>
                    <Input
                      id="new-transfer"
                      type="number"
                      step="0.01"
                      value={formData.precio_transferencia}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          precio_transferencia: e.target.value,
                          precio_otro_metodo: calcularPrecioOtroMetodo(e.target.value),
                        })
                      }}
                      placeholder="560.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-otro">Precio Otro Método (Q)</Label>
                    <Input
                      id="new-otro"
                      type="number"
                      step="0.01"
                      value={formData.precio_otro_metodo}
                      onChange={(e) => setFormData({ ...formData, precio_otro_metodo: e.target.value })}
                      placeholder="616.00 (+10%)"
                    />
                    <p className="text-xs text-gray-500 mt-1">Se calcula automáticamente (+10%)</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleCreate} size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    Guardar
                  </Button>
                  <Button onClick={cancelEdit} variant="outline" size="sm">
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cantidad de Cursos</TableHead>
                  <TableHead>Precio Transferencia</TableHead>
                  <TableHead>Precio Otro Método</TableHead>
                  <TableHead>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1 cursor-help">
                          Estado
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            Use el switch para activar o desactivar precios. Los precios inactivos no aparecerán en los formularios.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {precios.map((precio) => (
                  <TableRow 
                    key={precio.id} 
                    className={!precio.activo ? "bg-gray-50/50" : "hover:bg-blue-50/30"}
                  >
                    <TableCell>
                      {editingId === precio.id ? (
                        <Input
                          type="number"
                          value={formData.cantidad_cursos}
                          onChange={(e) => setFormData({ ...formData, cantidad_cursos: e.target.value })}
                          className="w-24"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{precio.cantidad_cursos} cursos</span>
                          {!precio.activo && (
                            <Badge variant="outline" className="text-xs bg-gray-100">
                              Inactivo
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === precio.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.precio_transferencia}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              precio_transferencia: e.target.value,
                              precio_otro_metodo: calcularPrecioOtroMetodo(e.target.value),
                            })
                          }}
                          className="w-32"
                        />
                      ) : (
                        `Q${parseFloat(String(precio.precio_transferencia)).toFixed(2)}`
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === precio.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.precio_otro_metodo}
                          onChange={(e) => setFormData({ ...formData, precio_otro_metodo: e.target.value })}
                          className="w-32"
                        />
                      ) : (
                        `Q${parseFloat(String(precio.precio_otro_metodo)).toFixed(2)}`
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={precio.activo}
                          onCheckedChange={() => confirmToggleActivo(precio.id, precio.activo)}
                          disabled={editingId === precio.id}
                        />
                        <span className={`text-sm font-medium ${precio.activo ? 'text-green-600' : 'text-gray-400'}`}>
                          {precio.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {editingId === precio.id ? (
                          <>
                            <Button onClick={() => handleUpdate(precio.id)} size="sm" className="bg-green-600 hover:bg-green-700">
                              <Save className="h-4 w-4 mr-1" />
                              Guardar
                            </Button>
                            <Button onClick={cancelEdit} variant="outline" size="sm">
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              onClick={() => startEdit(precio)} 
                              variant="outline" 
                              size="sm"
                              className="hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg">
              {itemToDelete?.activo ? (
                <>
                  <XCircle className="h-5 w-5 text-orange-500" />
                  <span>¿Desactivar este precio?</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>¿Activar este precio?</span>
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base space-y-2">
              {itemToDelete?.activo ? (
                <>
                  <p className="font-medium text-gray-700">
                    Este precio dejará de estar disponible en el sistema.
                  </p>
                  <p className="text-sm text-gray-600">
                    • No aparecerá en formularios de inscripción<br />
                    • No afectará registros existentes<br />
                    • Puede reactivarlo cuando lo necesite
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-gray-700">
                    Este precio volverá a estar disponible en el sistema.
                  </p>
                  <p className="text-sm text-gray-600">
                    • Aparecerá nuevamente en los formularios<br />
                    • Estará disponible para nuevas inscripciones
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:bg-gray-100">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeToggleActivo}
              className={itemToDelete?.activo 
                ? "bg-orange-600 hover:bg-orange-700 text-white" 
                : "bg-green-600 hover:bg-green-700 text-white"}
            >
              {itemToDelete?.activo ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Desactivar
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Activar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
