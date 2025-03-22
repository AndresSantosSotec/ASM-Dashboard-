"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Upload, ArrowLeft, X } from "lucide-react"

export default function FichaInscripcion() {
  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Button>
        <h1 className="text-2xl font-bold text-primary">Ficha de Inscripción</h1>
      </div>

      <Tabs defaultValue="datos-personales" className="w-full">
        <TabsList className="w-full justify-start bg-muted/20 p-0 h-auto flex-wrap">
          <TabsTrigger
            value="datos-personales"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none flex-1"
          >
            Datos Personales
          </TabsTrigger>
          <TabsTrigger
            value="datos-laborales"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none flex-1"
          >
            Datos Laborales
          </TabsTrigger>
          <TabsTrigger
            value="informacion-academica"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none flex-1"
          >
            Información Académica
          </TabsTrigger>
          <TabsTrigger
            value="datos-financieros"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none flex-1"
          >
            Datos Financieros
          </TabsTrigger>
          <TabsTrigger
            value="documentos"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none flex-1"
          >
            Documentos
          </TabsTrigger>
        </TabsList>

        {/* Datos Personales */}
        <TabsContent value="datos-personales" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre completo (Como aparece en DPI)</Label>
                  <Input id="nombre" defaultValue="Eduardo Luis Ramos Lemus" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pais-origen">País de origen</Label>
                  <Select defaultValue="Guatemala">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar país" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Guatemala">Guatemala</SelectItem>
                      {/* Agregar más países */}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono móvil</Label>
                  <Input id="telefono" defaultValue="42150787" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dpi">No. de Identificación (DPI)</Label>
                  <Input id="dpi" defaultValue="1642386030101" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-personal">Correo electrónico personal</Label>
                  <Input id="email-personal" type="email" defaultValue="eduardo.rl896@gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-corp">Correo electrónico corporativo</Label>
                  <Input id="email-corp" type="email" defaultValue="eduardo.rl896@gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha-nacimiento">Fecha de nacimiento</Label>
                  <Input id="fecha-nacimiento" type="date" defaultValue="1989-08-23" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Datos Laborales */}
        <TabsContent value="datos-laborales" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa en donde labora</Label>
                  <Input id="empresa" defaultValue="PAN AMERICAN SILVER" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="puesto">Puesto de trabajo</Label>
                  <Input id="puesto" defaultValue="Superintendente de Producción" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tel-corp">Teléfono corporativo</Label>
                  <Input id="tel-corp" defaultValue="42150787" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Información Académica */}
        <TabsContent value="informacion-academica" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="programa">Programa</Label>
                  <Select defaultValue="mpm">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar programa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mpm">MPM - Master of Project Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duracion">Duración de carrera (meses)</Label>
                  <Input id="duracion" defaultValue="21" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ultimo-titulo">Último título obtenido</Label>
                  <Select defaultValue="licenciatura">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar título" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="licenciatura">Licenciatura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modalidad">Modalidad</Label>
                  <Select defaultValue="sincronica">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sincronica">Sincrónica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha-inicio">Fecha de inicio</Label>
                  <Input id="fecha-inicio" type="date" defaultValue="2025-01-09" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha-induccion">Fecha taller de inducción</Label>
                  <Input id="fecha-induccion" type="date" defaultValue="2025-01-06" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Datos Financieros */}
        <TabsContent value="datos-financieros" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="beca">¿Posee alguna beca?</Label>
                  <Select defaultValue="no">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="si">Sí</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="porcentaje-beca">Porcentaje de Beca</Label>
                  <Input id="porcentaje-beca" defaultValue="0%" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forma-pago">Forma de Pago</Label>
                  <Select defaultValue="deposito">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar forma de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposito">Depósito Bancario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inscripcion">Inscripción (Q)</Label>
                  <Input id="inscripcion" defaultValue="1,000.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuota-mensual">Cuota Mensual (Q)</Label>
                  <Input id="cuota-mensual" defaultValue="1,400.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cantidad-meses">Cantidad en Meses</Label>
                  <Input id="cantidad-meses" defaultValue="16" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="inversion-total">Inversión Total (Q)</Label>
                  <Input id="inversion-total" defaultValue="26,200.00" className="font-bold" />
                </div>

                <div className="col-span-2 mt-4">
                  <h3 className="text-lg font-semibold mb-4 text-primary">Inversión Adicional Obligatoria</h3>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <div className="font-medium">Gastos finales</div>
                    <div className="font-medium">Servicios Electrónicos</div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Proyecto Final:</span>
                        <span>Q1,600.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Graduación:</span>
                        <span>Q2,845.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gastos de Título:</span>
                        <span>Q3,999.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Certificación Internacional:</span>
                        <span>Q2,000.00</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Programa de 21 Cursos:</span>
                        <span>Q1,074.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentos */}
        <TabsContent value="documentos" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Todos los documentos deben estar en formato PDF, JPG o PNG y no deben exceder los 5MB.
                </AlertDescription>
              </Alert>

              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Documentos Obligatorios</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* DPI */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">DPI (Ambos lados)</h4>
                        <p className="text-sm text-muted-foreground">
                          Documento de identificación personal, ambos lados en un solo archivo.
                        </p>
                      </div>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pendiente</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir Archivo
                    </Button>
                  </div>

                  {/* Recibo de luz */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">Recibo de luz o teléfono</h4>
                        <p className="text-sm text-muted-foreground">
                          Comprobante de domicilio reciente (no mayor a 3 meses).
                        </p>
                      </div>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pendiente</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir Archivo
                    </Button>
                  </div>

                  {/* Recibo de American */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">Recibo de American</h4>
                        <p className="text-sm text-muted-foreground">Comprobante de pago emitido por American SM.</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Cargado</span>
                    </div>
                    <div className="flex items-center justify-between bg-muted/50 p-2 rounded">
                      <span className="text-sm">Archivo cargado</span>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Boleta de pago */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">Boleta de pago de inscripción</h4>
                        <p className="text-sm text-muted-foreground">Comprobante de pago de la cuota de inscripción.</p>
                      </div>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pendiente</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir Archivo
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between mt-6">
        <Button variant="outline">Anterior</Button>
        <Button>Siguiente</Button>
      </div>
    </div>
  )
}

