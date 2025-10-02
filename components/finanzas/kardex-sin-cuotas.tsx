"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertCircle,
  Link2,
  Plus,
  Search,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { 
  getKardexSinCuotas, 
  createCuotasForStudent, 
  linkKardexToCuota,
  getCuotasDisponibles
} from "@/services/finance"
import { toast } from "@/hooks/use-toast"

interface KardexPago {
  id: number
  estudiante_programa_id: number
  numero_boleta: string
  monto: number
  fecha_pago: string
  banco: string
  estudiante_programa?: {
    prospecto?: {
      nombre_completo: string
      carnet: string
    }
    programa?: {
      nombre_del_programa: string
    }
  }
}

interface StudentGroup {
  carnet: string
  nombre: string
  programa: string
  estudiante_programa_id: number
  pagos: KardexPago[]
  total_monto: number
}

export function KardexSinCuotas() {
  const [loading, setLoading] = useState(true)
  const [groupedData, setGroupedData] = useState<StudentGroup[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateCuotasDialog, setShowCreateCuotasDialog] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentGroup | null>(null)
  const [selectedKardex, setSelectedKardex] = useState<KardexPago | null>(null)
  const [cuotasDisponibles, setCuotasDisponibles] = useState<any[]>([])
  const [selectedCuotaId, setSelectedCuotaId] = useState<number | null>(null)
  const [creatingCuotas, setCreatingCuotas] = useState(false)
  const [linking, setLinking] = useState(false)

  // Form data for creating cuotas
  const [cuotasForm, setCuotasForm] = useState({
    numero_cuotas: 1,
    monto_cuota: 0,
    fecha_inicio: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await getKardexSinCuotas()
      const kardexList = Array.isArray(response.data) ? response.data : response.data?.data || []
      
      // Group by student
      const grouped = groupByStudent(kardexList)
      setGroupedData(grouped)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const groupByStudent = (kardexList: KardexPago[]): StudentGroup[] => {
    const groups: Record<string, StudentGroup> = {}

    kardexList.forEach((kardex) => {
      const carnet = kardex.estudiante_programa?.prospecto?.carnet || "Sin carnet"
      
      if (!groups[carnet]) {
        groups[carnet] = {
          carnet,
          nombre: kardex.estudiante_programa?.prospecto?.nombre_completo || "Sin nombre",
          programa: kardex.estudiante_programa?.programa?.nombre_del_programa || "Sin programa",
          estudiante_programa_id: kardex.estudiante_programa_id,
          pagos: [],
          total_monto: 0,
        }
      }

      groups[carnet].pagos.push(kardex)
      groups[carnet].total_monto += Number(kardex.monto) || 0
    })

    return Object.values(groups).sort((a, b) => b.total_monto - a.total_monto)
  }

  const filteredData = groupedData.filter((student) =>
    student.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.carnet.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.programa.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-GT')
  }

  const openCreateCuotasDialog = (student: StudentGroup) => {
    setSelectedStudent(student)
    // Set default values based on payments
    const avgMonto = student.total_monto / student.pagos.length
    setCuotasForm({
      numero_cuotas: student.pagos.length,
      monto_cuota: Math.round(avgMonto),
      fecha_inicio: student.pagos[0]?.fecha_pago || new Date().toISOString().split('T')[0],
    })
    setShowCreateCuotasDialog(true)
  }

  const openLinkDialog = async (kardex: KardexPago, student: StudentGroup) => {
    setSelectedKardex(kardex)
    setSelectedStudent(student)
    setSelectedCuotaId(null)
    
    try {
      const response = await getCuotasDisponibles(student.estudiante_programa_id)
      const cuotas = Array.isArray(response.data) ? response.data : response.data?.data || []
      setCuotasDisponibles(cuotas)
      setShowLinkDialog(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las cuotas disponibles",
        variant: "destructive",
      })
    }
  }

  const handleCreateCuotas = async () => {
    if (!selectedStudent) return

    setCreatingCuotas(true)
    try {
      await createCuotasForStudent(selectedStudent.estudiante_programa_id, {
        numero_cuotas: cuotasForm.numero_cuotas,
        monto_cuota: cuotasForm.monto_cuota,
        fecha_inicio: cuotasForm.fecha_inicio,
      })

      toast({
        title: "Éxito",
        description: `Se crearon ${cuotasForm.numero_cuotas} cuotas para el estudiante`,
      })

      setShowCreateCuotasDialog(false)
      setSelectedStudent(null)
      await loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudieron crear las cuotas",
        variant: "destructive",
      })
    } finally {
      setCreatingCuotas(false)
    }
  }

  const handleLinkKardex = async () => {
    if (!selectedKardex || !selectedCuotaId) return

    setLinking(true)
    try {
      await linkKardexToCuota(selectedKardex.id, selectedCuotaId)

      toast({
        title: "Éxito",
        description: "El pago ha sido vinculado a la cuota",
      })

      setShowLinkDialog(false)
      setSelectedKardex(null)
      setSelectedCuotaId(null)
      await loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudo vincular el pago",
        variant: "destructive",
      })
    } finally {
      setLinking(false)
    }
  }

  const totalStudents = groupedData.length
  const totalPagos = groupedData.reduce((sum, s) => sum + s.pagos.length, 0)
  const totalMonto = groupedData.reduce((sum, s) => sum + s.total_monto, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kardex sin Cuotas Asignadas</h1>
        <p className="text-muted-foreground mt-2">
          Gestione pagos que fueron importados pero no tienen cuotas asignadas
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Atención</AlertTitle>
        <AlertDescription>
          Estos pagos fueron registrados en el kardex pero no pudieron ser vinculados a cuotas porque
          los estudiantes no tienen cuotas creadas en el sistema. Es necesario crear las cuotas o
          vincular manualmente estos pagos.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes Afectados</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos sin Cuota</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPagos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonto)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Estudiantes con Pagos sin Cuotas</CardTitle>
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
          <CardDescription>
            Total de {filteredData.length} estudiante(s) con pagos pendientes de asignación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, carnet o programa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No se encontraron resultados" : "No hay pagos sin cuotas asignadas"}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredData.map((student) => (
                <Card key={student.carnet} className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{student.nombre}</CardTitle>
                        <CardDescription>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{student.carnet}</Badge>
                            <Badge variant="secondary">{student.programa}</Badge>
                          </div>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Total Pagos</div>
                        <div className="text-xl font-bold">{formatCurrency(student.total_monto)}</div>
                        <div className="text-xs text-muted-foreground">{student.pagos.length} pago(s)</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex gap-2 mb-3">
                        <Button
                          onClick={() => openCreateCuotasDialog(student)}
                          size="sm"
                          variant="default"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Crear Cuotas
                        </Button>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Boleta</TableHead>
                            <TableHead>Banco</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {student.pagos.map((pago) => (
                            <TableRow key={pago.id}>
                              <TableCell className="font-medium">{pago.numero_boleta}</TableCell>
                              <TableCell>{pago.banco}</TableCell>
                              <TableCell>{formatDate(pago.fecha_pago)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(pago.monto)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  onClick={() => openLinkDialog(pago, student)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Link2 className="h-4 w-4 mr-1" />
                                  Vincular
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for creating cuotas */}
      <Dialog open={showCreateCuotasDialog} onOpenChange={setShowCreateCuotasDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Cuotas para Estudiante</DialogTitle>
            <DialogDescription>
              {selectedStudent && (
                <>
                  Crear cuotas para {selectedStudent.nombre} ({selectedStudent.carnet})
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="numero_cuotas">Número de Cuotas</Label>
              <Input
                id="numero_cuotas"
                type="number"
                min="1"
                value={cuotasForm.numero_cuotas}
                onChange={(e) => setCuotasForm({ ...cuotasForm, numero_cuotas: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monto_cuota">Monto por Cuota</Label>
              <Input
                id="monto_cuota"
                type="number"
                min="0"
                step="0.01"
                value={cuotasForm.monto_cuota}
                onChange={(e) => setCuotasForm({ ...cuotasForm, monto_cuota: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
              <Input
                id="fecha_inicio"
                type="date"
                value={cuotasForm.fecha_inicio}
                onChange={(e) => setCuotasForm({ ...cuotasForm, fecha_inicio: e.target.value })}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Se crearán {cuotasForm.numero_cuotas} cuotas de {formatCurrency(cuotasForm.monto_cuota)} cada una,
                totalizando {formatCurrency(cuotasForm.numero_cuotas * cuotasForm.monto_cuota)}.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCuotasDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCuotas} disabled={creatingCuotas}>
              {creatingCuotas ? "Creando..." : "Crear Cuotas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for linking to existing cuota */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Pago a Cuota</DialogTitle>
            <DialogDescription>
              {selectedKardex && (
                <>
                  Vincular boleta {selectedKardex.numero_boleta} de {formatCurrency(selectedKardex.monto)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {cuotasDisponibles.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No hay cuotas disponibles</AlertTitle>
                <AlertDescription>
                  Este estudiante no tiene cuotas creadas. Por favor, cree las cuotas primero.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <Label>Seleccione una cuota</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cuotasDisponibles.map((cuota: any) => (
                    <div
                      key={cuota.id}
                      className={`border rounded p-3 cursor-pointer hover:bg-accent ${
                        selectedCuotaId === cuota.id ? 'bg-accent border-primary' : ''
                      }`}
                      onClick={() => setSelectedCuotaId(cuota.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Cuota #{cuota.numero_cuota}</div>
                          <div className="text-sm text-muted-foreground">
                            Vence: {formatDate(cuota.fecha_vencimiento)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(cuota.monto)}</div>
                          <Badge variant={cuota.estado === 'pendiente' ? 'secondary' : 'default'}>
                            {cuota.estado}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleLinkKardex} 
              disabled={linking || !selectedCuotaId || cuotasDisponibles.length === 0}
            >
              {linking ? "Vinculando..." : "Vincular Pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
