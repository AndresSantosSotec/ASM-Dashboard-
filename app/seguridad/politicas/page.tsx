"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Clock, FileText, Key, Lock, RefreshCw, Save, Shield, User } from "lucide-react"

export default function PoliticasSeguridad() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Políticas de Seguridad</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Save className="mr-2 h-4 w-4" />
          Guardar Cambios
        </Button>
      </div>

      <Tabs defaultValue="contrasenas" className="mb-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="contrasenas">Contraseñas</TabsTrigger>
          <TabsTrigger value="sesiones">Sesiones</TabsTrigger>
          <TabsTrigger value="autenticacion">Autenticación</TabsTrigger>
          <TabsTrigger value="acceso">Control de Acceso</TabsTrigger>
        </TabsList>

        <TabsContent value="contrasenas" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Requisitos de Contraseña</CardTitle>
                <CardDescription>Configuración de políticas de contraseñas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Longitud mínima</p>
                      <p className="text-sm text-gray-500">Mínimo de caracteres requeridos</p>
                    </div>
                  </div>
                  <Input type="number" defaultValue="8" className="w-20 text-center" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Requiere mayúsculas</p>
                      <p className="text-sm text-gray-500">Al menos una letra mayúscula</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Requiere números</p>
                      <p className="text-sm text-gray-500">Al menos un número</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Requiere caracteres especiales</p>
                      <p className="text-sm text-gray-500">Al menos un carácter especial</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">No permitir contraseñas comunes</p>
                      <p className="text-sm text-gray-500">Bloquear contraseñas fáciles de adivinar</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Caducidad y Renovación</CardTitle>
                <CardDescription>Políticas de renovación de contraseñas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <RefreshCw className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Caducidad de contraseña</p>
                      <p className="text-sm text-gray-500">Días hasta expiración</p>
                    </div>
                  </div>
                  <Input type="number" defaultValue="90" className="w-20 text-center" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <RefreshCw className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Historial de contraseñas</p>
                      <p className="text-sm text-gray-500">No repetir últimas contraseñas</p>
                    </div>
                  </div>
                  <Input type="number" defaultValue="5" className="w-20 text-center" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Notificar antes de caducidad</p>
                      <p className="text-sm text-gray-500">Días de anticipación</p>
                    </div>
                  </div>
                  <Input type="number" defaultValue="7" className="w-20 text-center" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Forzar cambio en primer inicio</p>
                      <p className="text-sm text-gray-500">Para nuevos usuarios</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Bloquear tras intentos fallidos</p>
                      <p className="text-sm text-gray-500">Número de intentos</p>
                    </div>
                  </div>
                  <Input type="number" defaultValue="5" className="w-20 text-center" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sesiones" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Sesiones</CardTitle>
                <CardDescription>Políticas de duración y gestión de sesiones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Tiempo de inactividad</p>
                      <p className="text-sm text-gray-500">Minutos hasta cierre automático</p>
                    </div>
                  </div>
                  <Input type="number" defaultValue="30" className="w-20 text-center" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Duración máxima de sesión</p>
                      <p className="text-sm text-gray-500">Horas hasta cierre forzado</p>
                    </div>
                  </div>
                  <Input type="number" defaultValue="8" className="w-20 text-center" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Sesiones simultáneas</p>
                      <p className="text-sm text-gray-500">Máximo de sesiones por usuario</p>
                    </div>
                  </div>
                  <Input type="number" defaultValue="3" className="w-20 text-center" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Validar IP en sesión</p>
                      <p className="text-sm text-gray-500">Detectar cambios de IP</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Cerrar sesiones inactivas</p>
                      <p className="text-sm text-gray-500">Automáticamente</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Restricciones de Acceso</CardTitle>
                <CardDescription>Limitaciones por ubicación y dispositivo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Restringir por país</p>
                      <p className="text-sm text-gray-500">Limitar acceso por ubicación</p>
                    </div>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Restringir por red</p>
                      <p className="text-sm text-gray-500">Limitar a redes específicas</p>
                    </div>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Restringir por dispositivo</p>
                      <p className="text-sm text-gray-500">Limitar a dispositivos registrados</p>
                    </div>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Horario de acceso</p>
                      <p className="text-sm text-gray-500">Limitar a horario laboral</p>
                    </div>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Notificar accesos inusuales</p>
                      <p className="text-sm text-gray-500">Alertar al administrador</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="autenticacion" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Autenticación de Dos Factores</CardTitle>
                <CardDescription>Configuración de 2FA para usuarios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Key className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">2FA obligatorio</p>
                      <p className="text-sm text-gray-500">Para todos los usuarios</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Key className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">2FA para roles específicos</p>
                      <p className="text-sm text-gray-500">Administradores y roles críticos</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Key className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Recordar dispositivo</p>
                      <p className="text-sm text-gray-500">Días para recordar dispositivo confiable</p>
                    </div>
                  </div>
                  <Input type="number" defaultValue="30" className="w-20 text-center" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Key className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Métodos permitidos</p>
                      <p className="text-sm text-gray-500">Seleccionar métodos 2FA disponibles</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Notificar cambios 2FA</p>
                      <p className="text-sm text-gray-500">Alertar al usuario</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Otras Configuraciones</CardTitle>
                <CardDescription>Políticas adicionales de autenticación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">CAPTCHA</p>
                      <p className="text-sm text-gray-500">Tras intentos fallidos</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Single Sign-On (SSO)</p>
                      <p className="text-sm text-gray-500">Habilitar integración SSO</p>
                    </div>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Autenticación biométrica</p>
                      <p className="text-sm text-gray-500">Habilitar cuando esté disponible</p>
                    </div>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Verificación de correo</p>
                      <p className="text-sm text-gray-500">Para nuevos usuarios</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Recuperación de cuenta</p>
                      <p className="text-sm text-gray-500">Métodos permitidos</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="acceso" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Control de Acceso</CardTitle>
                <CardDescription>Políticas de acceso a módulos y funciones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Principio de mínimo privilegio</p>
                      <p className="text-sm text-gray-500">Acceso solo a lo necesario</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Segregación de funciones</p>
                      <p className="text-sm text-gray-500">Separar responsabilidades críticas</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Acceso basado en roles</p>
                      <p className="text-sm text-gray-500">Gestión por grupos de usuarios</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Aprobación para acciones críticas</p>
                      <p className="text-sm text-gray-500">Requiere autorización adicional</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Matriz de acceso</p>
                      <p className="text-sm text-gray-500">Configuración detallada</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Auditoría y Monitoreo</CardTitle>
                <CardDescription>Configuración de registro y alertas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Registro de actividad</p>
                      <p className="text-sm text-gray-500">Nivel de detalle</p>
                    </div>
                  </div>
                  <select className="rounded-md border border-gray-300 px-3 py-1">
                    <option>Alto</option>
                    <option>Medio</option>
                    <option>Bajo</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Retención de logs</p>
                      <p className="text-sm text-gray-500">Días de almacenamiento</p>
                    </div>
                  </div>
                  <Input type="number" defaultValue="365" className="w-20 text-center" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Alertas de seguridad</p>
                      <p className="text-sm text-gray-500">Notificaciones automáticas</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Monitoreo en tiempo real</p>
                      <p className="text-sm text-gray-500">Detección de anomalías</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium">Informes de seguridad</p>
                      <p className="text-sm text-gray-500">Frecuencia de generación</p>
                    </div>
                  </div>
                  <select className="rounded-md border border-gray-300 px-3 py-1">
                    <option>Diario</option>
                    <option>Semanal</option>
                    <option>Mensual</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

