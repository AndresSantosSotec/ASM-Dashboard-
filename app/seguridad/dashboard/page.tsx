import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import {
  Users,
  ShieldCheck,
  Lock,
  FileText,
  History,
  AlertTriangle,
  UserX,
  UserCheck,
  ShieldAlert,
  Clock,
  ArrowRight,
  LineChart,
  KeyRound,
  Eye,
  LogOut,
  Settings,
  Bell,
  CheckCircle,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Dashboard de Seguridad | Blue Atlas",
  description: "Panel de control de seguridad del sistema",
}

export default function SeguridadDashboardPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Seguridad</h1>
          <p className="text-muted-foreground">Monitoreo y gestión centralizada de la seguridad del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bell className="mr-2 h-4 w-4" />
            Configurar Alertas
          </Button>
          <Button size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Generar Informe
          </Button>
        </div>
      </div>

      {/* Alertas de seguridad */}
      <Alert variant="default" className="bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Atención</AlertTitle>
        <AlertDescription className="text-amber-700">
          Se han detectado 3 intentos fallidos de inicio de sesión en las últimas 24 horas.
          <Button variant="link" className="h-auto p-0 text-amber-800 font-medium ml-1">
            Ver detalles
          </Button>
        </AlertDescription>
      </Alert>

      {/* Tarjetas de estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">152</div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-green-600 font-medium flex items-center">
                <ArrowRight className="h-3 w-3 mr-1 rotate-45" />
                +5 en el último mes
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles Configurados</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-green-600 font-medium flex items-center">
                <ArrowRight className="h-3 w-3 mr-1 rotate-45" />
                +1 en el último mes
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permisos Totales</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-green-600 font-medium flex items-center">
                <ArrowRight className="h-3 w-3 mr-1 rotate-45" />
                +3 en el último mes
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos de Auditoría</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <div className="flex items-center pt-1">
              <span className="text-xs text-green-600 font-medium flex items-center">
                <ArrowRight className="h-3 w-3 mr-1 rotate-45" />
                +324 en el último mes
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos y actividad */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* Gráficos - 4 columnas */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Actividad de Seguridad</CardTitle>
            <CardDescription>Eventos de seguridad registrados en los últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <div className="w-full space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-sm">Inicios de sesión</span>
                    </div>
                    <span className="text-sm font-medium">452</span>
                  </div>
                  <Progress value={75} className="h-2 bg-blue-100">
                    <div className="h-2 bg-blue-500" style={{ width: '75%' }}></div>
                  </Progress>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Cambios de permisos</span>
                    </div>
                    <span className="text-sm font-medium">128</span>
                  </div>
                  <Progress value={35} className="h-2 bg-green-100">
                    <div className="h-2 bg-green-500" style={{ width: '35%' }}></div>
                  </Progress>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                      <span className="text-sm">Cambios de configuración</span>
                    </div>
                    <span className="text-sm font-medium">86</span>
                  </div>
                  <Progress value={25} className="h-2 bg-amber-100">
                    <div className="h-2 bg-amber-500" style={{ width: '25%' }}></div>
                  </Progress>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <span className="text-sm">Intentos fallidos</span>
                    </div>
                    <span className="text-sm font-medium">24</span>
                  </div>
                  <Progress value={10} className="h-2 bg-red-100">
                    <div className="h-2 bg-red-500" style={{ width: '10%' }}></div>
                  </Progress>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <LineChart className="mr-2 h-4 w-4" />
              Actualizado hace 2 horas
            </div>
            <Button variant="ghost" size="sm">
              Ver detalles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* Actividad reciente - 3 columnas */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones realizadas en el sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <UserCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Nuevo usuario creado</p>
                <p className="text-xs text-muted-foreground">
                  El administrador Juan Pérez creó el usuario "María López"
                </p>
                <p className="text-xs text-muted-foreground">Hace 35 minutos</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-amber-100 p-2 rounded-full">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Rol modificado</p>
                <p className="text-xs text-muted-foreground">Se actualizaron los permisos del rol "Asesor"</p>
                <p className="text-xs text-muted-foreground">Hace 2 horas</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-red-100 p-2 rounded-full">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Usuario desactivado</p>
                <p className="text-xs text-muted-foreground">El usuario "Carlos Rodríguez" fue desactivado</p>
                <p className="text-xs text-muted-foreground">Hace 5 horas</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-green-100 p-2 rounded-full">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Política actualizada</p>
                <p className="text-xs text-muted-foreground">Se actualizó la política de contraseñas</p>
                <p className="text-xs text-muted-foreground">Hace 1 día</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/seguridad/auditoria">
                Ver todos los eventos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Secciones de seguridad */}
      <Tabs defaultValue="alertas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alertas">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Alertas de Seguridad
          </TabsTrigger>
          <TabsTrigger value="sesiones">
            <Users className="mr-2 h-4 w-4" />
            Sesiones Activas
          </TabsTrigger>
          <TabsTrigger value="politicas">
            <KeyRound className="mr-2 h-4 w-4" />
            Estado de Políticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alertas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Seguridad</CardTitle>
              <CardDescription>Eventos que requieren atención</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="bg-red-100 p-2 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Múltiples intentos fallidos</p>
                  <p className="text-xs text-muted-foreground">
                    3 intentos fallidos de inicio de sesión para el usuario "admin@example.com"
                  </p>
                  <p className="text-xs text-muted-foreground">Hace 2 horas - IP: 192.168.1.105</p>
                  <div className="flex gap-2 mt-1">
                    <Button variant="outline" size="sm">
                      Bloquear IP
                    </Button>
                    <Button variant="outline" size="sm">
                      Bloquear Usuario
                    </Button>
                    <Button size="sm">Investigar</Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-amber-100 p-2 rounded-full">
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Permiso sensible modificado</p>
                  <p className="text-xs text-muted-foreground">
                    El permiso "usuarios.eliminar" fue asignado al rol "Asesor"
                  </p>
                  <p className="text-xs text-muted-foreground">Hace 1 día</p>
                  <div className="flex gap-2 mt-1">
                    <Button variant="outline" size="sm">
                      Revertir Cambio
                    </Button>
                    <Button size="sm">Revisar</Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-amber-100 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Contraseñas próximas a expirar</p>
                  <p className="text-xs text-muted-foreground">
                    5 usuarios tienen contraseñas que expirarán en los próximos 7 días
                  </p>
                  <p className="text-xs text-muted-foreground">Verificado hoy</p>
                  <div className="flex gap-2 mt-1">
                    <Button variant="outline" size="sm">
                      Ver Usuarios
                    </Button>
                    <Button size="sm">Enviar Notificación</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sesiones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sesiones Activas</CardTitle>
              <CardDescription>Usuarios actualmente conectados al sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="font-semibold text-blue-600">JP</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Juan Pérez</p>
                      <p className="text-xs text-muted-foreground">Administrador</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    <p>192.168.1.100</p>
                    <p>Conectado hace 35 min</p>
                    <Button variant="ghost" size="sm" className="h-7 mt-1">
                      <LogOut className="mr-1 h-3 w-3" />
                      Cerrar sesión
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="font-semibold text-green-600">ML</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">María López</p>
                      <p className="text-xs text-muted-foreground">Asesor</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    <p>192.168.1.120</p>
                    <p>Conectado hace 15 min</p>
                    <Button variant="ghost" size="sm" className="h-7 mt-1">
                      <LogOut className="mr-1 h-3 w-3" />
                      Cerrar sesión
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="font-semibold text-purple-600">RS</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Roberto Sánchez</p>
                      <p className="text-xs text-muted-foreground">Administrativo</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    <p>192.168.1.110</p>
                    <p>Conectado hace 5 min</p>
                    <Button variant="ghost" size="sm" className="h-7 mt-1">
                      <LogOut className="mr-1 h-3 w-3" />
                      Cerrar sesión
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button variant="outline" className="w-full">
                Cerrar todas las sesiones
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="politicas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Políticas de Seguridad</CardTitle>
              <CardDescription>Configuración actual de las políticas de seguridad</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <KeyRound className="h-4 w-4 mr-2 text-muted-foreground" />
                      <h3 className="text-sm font-medium">Política de Contraseñas</h3>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activa
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="text-xs">
                      <p className="text-muted-foreground">Longitud mínima</p>
                      <p className="font-medium">8 caracteres</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-muted-foreground">Expiración</p>
                      <p className="font-medium">90 días</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-muted-foreground">Complejidad</p>
                      <p className="font-medium">Alta (letras, números, símbolos)</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-muted-foreground">Historial</p>
                      <p className="font-medium">5 contraseñas</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <h3 className="text-sm font-medium">Política de Acceso</h3>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Requiere revisión
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="text-xs">
                      <p className="text-muted-foreground">Intentos fallidos</p>
                      <p className="font-medium">5 intentos</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-muted-foreground">Tiempo de bloqueo</p>
                      <p className="font-medium">30 minutos</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-muted-foreground">Autenticación 2FA</p>
                      <p className="font-medium text-amber-600">No habilitada</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-muted-foreground">Tiempo de inactividad</p>
                      <p className="font-medium">30 minutos</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                      <h3 className="text-sm font-medium">Política de Auditoría</h3>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activa
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="text-xs">
                      <p className="text-muted-foreground">Registro de accesos</p>
                      <p className="font-medium">Habilitado</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-muted-foreground">Registro de cambios</p>
                      <p className="font-medium">Habilitado</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-muted-foreground">Retención de logs</p>
                      <p className="font-medium">90 días</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-muted-foreground">Alertas automáticas</p>
                      <p className="font-medium">Habilitadas</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button className="w-full" asChild>
                <Link href="/seguridad/politicas">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurar Políticas
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Accesos rápidos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Gestión de Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Administra usuarios, asigna roles y permisos</p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
              <Link href="/seguridad?tab=usuarios">
                <ArrowRight className="h-4 w-4 mr-2" />
                Ir a Usuarios
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <ShieldCheck className="h-5 w-5 mr-2 text-amber-600" />
              Roles y Permisos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Configura roles y asigna permisos del sistema</p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
              <Link href="/seguridad?tab=roles">
                <ArrowRight className="h-4 w-4 mr-2" />
                Ir a Roles
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <KeyRound className="h-5 w-5 mr-2 text-green-600" />
              Políticas de Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Configura políticas de contraseñas y acceso</p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
              <Link href="/seguridad?tab=politicas">
                <ArrowRight className="h-4 w-4 mr-2" />
                Ir a Políticas
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <History className="h-5 w-5 mr-2 text-purple-600" />
              Logs de Auditoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Revisa el historial de actividades y eventos</p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
              <Link href="/seguridad?tab=auditoria">
                <ArrowRight className="h-4 w-4 mr-2" />
                Ir a Auditoría
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

