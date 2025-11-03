import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Wand2, Eye, CheckCircle, Users, Calculator, Calendar } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useGeneracionMasivaTab } from "@/hooks/useGeneracionMasivaTab"

interface GeneracionMasivaTabProps {
  onDataGenerated?: () => void
}

const GeneracionMasivaTab: React.FC<GeneracionMasivaTabProps> = ({ onDataGenerated }) => {
  const {
    // Estados del modal de generación masiva
    showMasivaModal,
    setShowMasivaModal,
    masivaLoading,
    masivaFormData,
    
    // Estados del preview
    previewData,
    showPreview,
    previewLoading,
    
    // Funciones principales
    generatePreview,
    ejecutarGeneracionMasiva,
    
    // Handlers
    handleGeneracionMasiva,
    handleCancelMasiva,
    handleMasivaFormChange,
  } = useGeneracionMasivaTab({ onDataGenerated })

  return (
    <div className="space-y-6">
      {/* Información de la funcionalidad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Generación Masiva de Cuotas
          </CardTitle>
          <CardDescription>
            Crear múltiples cuotas de manera automática para todos los estudiantes de un programa específico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="font-medium">Selección por Programa</h3>
                <p className="text-sm text-muted-foreground">Aplica a todos los estudiantes activos</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Calculator className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="font-medium">Monto Unificado</h3>
                <p className="text-sm text-muted-foreground">Mismo monto para todas las cuotas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div>
                <h3 className="font-medium">Fechas Automáticas</h3>
                <p className="text-sm text-muted-foreground">Vencimientos según intervalo</p>
              </div>
            </div>
          </div>
          
          <Dialog open={showMasivaModal} onOpenChange={setShowMasivaModal}>
            <DialogTrigger asChild>
              <Button onClick={handleGeneracionMasiva} size="lg" className="w-full">
                <Wand2 className="h-4 w-4 mr-2" />
                Iniciar Generación Masiva
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configurar Generación Masiva de Cuotas</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Formulario de configuración */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="programaId">Programa Académico</Label>
                    <Select
                      value={masivaFormData.programaId}
                      onValueChange={(value) => handleMasivaFormChange("programaId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar programa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Ingeniería de Sistemas</SelectItem>
                        <SelectItem value="2">Administración de Empresas</SelectItem>
                        <SelectItem value="3">Contaduría Pública</SelectItem>
                        <SelectItem value="4">Derecho</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                    <Input
                      id="fechaInicio"
                      type="date"
                      value={masivaFormData.fechaInicio}
                      onChange={(e) => handleMasivaFormChange("fechaInicio", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="numCuotas">Número de Cuotas</Label>
                    <Input
                      id="numCuotas"
                      type="number"
                      min="1"
                      max="12"
                      value={masivaFormData.numCuotas}
                      onChange={(e) => handleMasivaFormChange("numCuotas", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="montoCuota">Monto por Cuota</Label>
                    <Input
                      id="montoCuota"
                      type="number"
                      step="0.01"
                      value={masivaFormData.montoCuota}
                      onChange={(e) => handleMasivaFormChange("montoCuota", e.target.value)}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="intervalo">Intervalo entre Cuotas</Label>
                    <Select
                      value={masivaFormData.intervalo}
                      onValueChange={(value) => handleMasivaFormChange("intervalo", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="biweekly">Quincenal</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Botones de acción */}
                <div className="flex justify-between">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={generatePreview}
                      disabled={previewLoading}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {previewLoading ? "Generando..." : "Vista Previa"}
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancelMasiva}>
                      Cancelar
                    </Button>
                    {showPreview && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button disabled={masivaLoading}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {masivaLoading ? "Ejecutando..." : "Confirmar Generación"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Confirmar Generación Masiva?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se van a crear {previewData.length} cuotas para los estudiantes del programa seleccionado. 
                              Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={ejecutarGeneracionMasiva}>
                              Confirmar Generación
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
                
                {/* Preview de cuotas */}
                {showPreview && previewData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Vista Previa - {previewData.length} Cuotas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-64 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Estudiante</TableHead>
                              <TableHead>Cuota N°</TableHead>
                              <TableHead>Vencimiento</TableHead>
                              <TableHead>Monto</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.slice(0, 10).map((item: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="text-sm">
                                  {item.estudiante_nombre}
                                </TableCell>
                                <TableCell>{item.numero_cuota}</TableCell>
                                <TableCell>{formatDate(item.fecha_vencimiento)}</TableCell>
                                <TableCell>{formatCurrency(item.monto)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {previewData.length > 10 && (
                          <div className="text-center text-sm text-muted-foreground mt-2">
                            ... y {previewData.length - 10} cuotas más
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
      
      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Instrucciones de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <div>
                <strong>Selecciona el programa:</strong> Elige el programa académico para el cual deseas generar cuotas.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <div>
                <strong>Configura los parámetros:</strong> Define la fecha de inicio, número de cuotas, monto y frecuencia.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <div>
                <strong>Genera vista previa:</strong> Revisa las cuotas que se van a crear antes de confirmar.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">4</Badge>
              <div>
                <strong>Confirma la generación:</strong> Una vez satisfecho con la preview, confirma para crear las cuotas.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default GeneracionMasivaTab