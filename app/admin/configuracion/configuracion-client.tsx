"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GruposCorreoModal } from "@/components/admin/grupos-correo-modal"

export default function ConfiguracionClient() {
  const [openGruposModal, setOpenGruposModal] = useState(false)

  const handleSaveConfig = () => {
    toast({
      title: "Configuración guardada",
      description: "Los cambios han sido guardados correctamente.",
    })
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Configuración General</h1>
        <Button onClick={handleSaveConfig}>Guardar Cambios</Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="correos">Correos Masivos</TabsTrigger>
          <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
          <TabsTrigger value="integraciones">Integraciones</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Institucional</CardTitle>
                <CardDescription>Configura la información básica de la institución</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre-institucion">Nombre de la Institución</Label>
                  <Input id="nombre-institucion" defaultValue="Blue Atlas Academy" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Textarea id="direccion" defaultValue="Calle Principal #123, Ciudad" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input id="telefono" defaultValue="+502 1234-5678" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-contacto">Email de Contacto</Label>
                  <Input id="email-contacto" defaultValue="contacto@blueatlas.edu" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuración del Sistema</CardTitle>
                <CardDescription>Ajustes generales del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="modo-mantenimiento">Modo Mantenimiento</Label>
                    <p className="text-sm text-muted-foreground">
                      Activa el modo mantenimiento para realizar actualizaciones
                    </p>
                  </div>
                  <Switch id="modo-mantenimiento" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="registro-actividad">Registro de Actividad</Label>
                    <p className="text-sm text-muted-foreground">Registra todas las acciones de los usuarios</p>
                  </div>
                  <Switch id="registro-actividad" defaultChecked />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="zona-horaria">Zona Horaria</Label>
                  <Select defaultValue="america-guatemala">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona zona horaria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="america-guatemala">América/Guatemala (GMT-6)</SelectItem>
                      <SelectItem value="america-mexico">América/México (GMT-6)</SelectItem>
                      <SelectItem value="america-el_salvador">América/El Salvador (GMT-6)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notificaciones">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
              <CardDescription>Gestiona cómo se envían las notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif-email">Notificaciones por Email</Label>
                  <p className="text-sm text-muted-foreground">Enviar notificaciones por correo electrónico</p>
                </div>
                <Switch id="notif-email" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif-sistema">Notificaciones del Sistema</Label>
                  <p className="text-sm text-muted-foreground">Mostrar notificaciones en el sistema</p>
                </div>
                <Switch id="notif-sistema" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif-sms">Notificaciones por SMS</Label>
                  <p className="text-sm text-muted-foreground">Enviar notificaciones por mensaje de texto</p>
                </div>
                <Switch id="notif-sms" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correos">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Correos Masivos</CardTitle>
                <CardDescription>Configura los parámetros para envíos masivos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="remitente">Nombre del Remitente</Label>
                  <Input id="remitente" defaultValue="Blue Atlas Academy" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-remitente">Email del Remitente</Label>
                  <Input id="email-remitente" defaultValue="noreply@blueatlas.edu" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="limite-diario">Límite Diario de Envíos</Label>
                  <Input id="limite-diario" type="number" defaultValue="1000" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="seguimiento">Seguimiento de Apertura</Label>
                    <p className="text-sm text-muted-foreground">Registrar cuando los correos son abiertos</p>
                  </div>
                  <Switch id="seguimiento" defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Grupos de Correos</CardTitle>
                  <CardDescription>Gestiona grupos para envíos masivos</CardDescription>
                </div>
                <Button onClick={() => setOpenGruposModal(true)}>Gestionar Grupos</Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    <div className="bg-muted p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Estudiantes Activos</h4>
                          <p className="text-sm text-muted-foreground">245 contactos</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Ver
                        </Button>
                      </div>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Docentes</h4>
                          <p className="text-sm text-muted-foreground">32 contactos</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Ver
                        </Button>
                      </div>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Prospectos Recientes</h4>
                          <p className="text-sm text-muted-foreground">78 contactos</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Ver
                        </Button>
                      </div>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Administrativos</h4>
                          <p className="text-sm text-muted-foreground">18 contactos</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Ver
                        </Button>
                      </div>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Graduados</h4>
                          <p className="text-sm text-muted-foreground">156 contactos</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Ver
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="apariencia">
          <Card>
            <CardHeader>
              <CardTitle>Personalización de la Interfaz</CardTitle>
              <CardDescription>Configura la apariencia del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tema">Tema Predeterminado</Label>
                <Select defaultValue="light">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="system">Según Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color-primario">Color Primario</Label>
                <div className="flex gap-2">
                  <Input id="color-primario" type="color" defaultValue="#0066cc" className="w-16 h-10" />
                  <Input defaultValue="#0066cc" className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo de la Institución</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Logo</span>
                  </div>
                  <Button variant="outline">Cambiar Logo</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integraciones">
          <Card>
            <CardHeader>
              <CardTitle>Integraciones con Servicios Externos</CardTitle>
              <CardDescription>Configura conexiones con servicios externos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Google Workspace</h3>
                    <p className="text-sm text-muted-foreground">Integración con servicios de Google</p>
                  </div>
                  <Button variant="outline">Configurar</Button>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Microsoft 365</h3>
                    <p className="text-sm text-muted-foreground">Integración con servicios de Microsoft</p>
                  </div>
                  <Button variant="outline">Configurar</Button>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Pasarela de Pagos</h3>
                    <p className="text-sm text-muted-foreground">Configuración de procesadores de pago</p>
                  </div>
                  <Button variant="outline">Configurar</Button>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">API de Mensajería SMS</h3>
                    <p className="text-sm text-muted-foreground">Configuración para envío de SMS</p>
                  </div>
                  <Button variant="outline">Configurar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <GruposCorreoModal open={openGruposModal} onOpenChange={setOpenGruposModal} />
    </div>
  )
}

