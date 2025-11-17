"use client"

import { useEffect, useState } from "react"
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
  Loader2,
} from "lucide-react"
import { seguridadDashboardService, type RespuestaDashboard } from "@/services/seguridad-dashboard"
import { toast } from "sonner"

export default function SeguridadDashboardPage() {
  const [datos, setDatos] = useState<RespuestaDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [cerrandoSesion, setCerrandoSesion] = useState<string | null>(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const response = await seguridadDashboardService.obtenerDashboard()
      setDatos(response)
    } catch (error) {
      console.error('Error cargando dashboard:', error)
      toast.error('Error al cargar el dashboard de seguridad')
    } finally {
      setLoading(false)
    }
  }

  const cerrarSesion = async (sessionId: string) => {
    try {
      setCerrandoSesion(sessionId)
      await seguridadDashboardService.cerrarSesion(sessionId)
      toast.success('Sesión cerrada exitosamente')
      cargarDatos()
    } catch (error) {
      console.error('Error cerrando sesión:', error)
      toast.error('Error al cerrar la sesión')
    } finally {
      setCerrandoSesion(null)
    }
  }

  const cerrarTodasLasSesiones = async () => {
    if (!confirm('¿Estás seguro de cerrar todas las sesiones activas?')) return
    
    try {
      await seguridadDashboardService.cerrarTodasLasSesiones()
      toast.success('Todas las sesiones han sido cerradas')
      cargarDatos()
    } catch (error) {
      console.error('Error cerrando todas las sesiones:', error)
      toast.error('Error al cerrar las sesiones')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Cargando dashboard...</span>
      </div>
    )
  }

  if (!datos) {
    return (
      <div className="flex items-center justify-center h-96">
        <AlertTriangle className="h-8 w-8 text-red-600 mr-2" />
        <span>Error al cargar los datos del dashboard</span>
      </div>
    )
  }
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
      {datos.alertas.length > 0 && (
        <Alert variant="default" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Atención</AlertTitle>
          <AlertDescription className="text-amber-700">
            {datos.alertas[0].descripcion}
            <Button variant="link" className="h-auto p-0 text-amber-800 font-medium ml-1">
              Ver detalles
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Tarjetas de estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{datos.estadisticas.usuarios_activos}</div>
            <div className="flex items-center pt-1">
              <span className={`text-xs font-medium flex items-center ${datos.estadisticas.usuarios_activos_cambio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <ArrowRight className={`h-3 w-3 mr-1 ${datos.estadisticas.usuarios_activos_cambio >= 0 ? 'rotate-45' : '-rotate-45'}`} />
                {datos.estadisticas.usuarios_activos_cambio >= 0 ? '+' : ''}{datos.estadisticas.usuarios_activos_cambio} en el último mes
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
            <div className="text-2xl font-bold">{datos.estadisticas.roles_configurados}</div>
            <div className="flex items-center pt-1">
              <span className={`text-xs font-medium flex items-center ${datos.estadisticas.roles_configurados_cambio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <ArrowRight className={`h-3 w-3 mr-1 ${datos.estadisticas.roles_configurados_cambio >= 0 ? 'rotate-45' : '-rotate-45'}`} />
                {datos.estadisticas.roles_configurados_cambio >= 0 ? '+' : ''}{datos.estadisticas.roles_configurados_cambio} en el último mes
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
            <div className="text-2xl font-bold">{datos.estadisticas.permisos_totales}</div>
            <div className="flex items-center pt-1">
              <span className={`text-xs font-medium flex items-center ${datos.estadisticas.permisos_totales_cambio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <ArrowRight className={`h-3 w-3 mr-1 ${datos.estadisticas.permisos_totales_cambio >= 0 ? 'rotate-45' : '-rotate-45'}`} />
                {datos.estadisticas.permisos_totales_cambio >= 0 ? '+' : ''}{datos.estadisticas.permisos_totales_cambio} en el último mes
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
            <div className="text-2xl font-bold">{datos.estadisticas.eventos_auditoria.toLocaleString()}</div>
            <div className="flex items-center pt-1">
              <span className={`text-xs font-medium flex items-center ${datos.estadisticas.eventos_auditoria_cambio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <ArrowRight className={`h-3 w-3 mr-1 ${datos.estadisticas.eventos_auditoria_cambio >= 0 ? 'rotate-45' : '-rotate-45'}`} />
                {datos.estadisticas.eventos_auditoria_cambio >= 0 ? '+' : ''}{datos.estadisticas.eventos_auditoria_cambio} en el último mes
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
                    <span className="text-sm font-medium">{datos.actividad.inicios_sesion}</span>
                  </div>
                  <Progress value={(datos.actividad.inicios_sesion / (datos.actividad.inicios_sesion + datos.actividad.cambios_permisos + datos.actividad.cambios_configuracion + datos.actividad.intentos_fallidos)) * 100} className="h-2 bg-blue-100">
                    <div className="h-2 bg-blue-500" style={{ width: `${(datos.actividad.inicios_sesion / (datos.actividad.inicios_sesion + datos.actividad.cambios_permisos + datos.actividad.cambios_configuracion + datos.actividad.intentos_fallidos)) * 100}%` }}></div>
                  </Progress>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Cambios de permisos</span>
                    </div>
                    <span className="text-sm font-medium">{datos.actividad.cambios_permisos}</span>
                  </div>
                  <Progress value={(datos.actividad.cambios_permisos / (datos.actividad.inicios_sesion + datos.actividad.cambios_permisos + datos.actividad.cambios_configuracion + datos.actividad.intentos_fallidos)) * 100} className="h-2 bg-green-100">
                    <div className="h-2 bg-green-500" style={{ width: `${(datos.actividad.cambios_permisos / (datos.actividad.inicios_sesion + datos.actividad.cambios_permisos + datos.actividad.cambios_configuracion + datos.actividad.intentos_fallidos)) * 100}%` }}></div>
                  </Progress>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                      <span className="text-sm">Cambios de configuración</span>
                    </div>
                    <span className="text-sm font-medium">{datos.actividad.cambios_configuracion}</span>
                  </div>
                  <Progress value={(datos.actividad.cambios_configuracion / (datos.actividad.inicios_sesion + datos.actividad.cambios_permisos + datos.actividad.cambios_configuracion + datos.actividad.intentos_fallidos)) * 100} className="h-2 bg-amber-100">
                    <div className="h-2 bg-amber-500" style={{ width: `${(datos.actividad.cambios_configuracion / (datos.actividad.inicios_sesion + datos.actividad.cambios_permisos + datos.actividad.cambios_configuracion + datos.actividad.intentos_fallidos)) * 100}%` }}></div>
                  </Progress>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <span className="text-sm">Intentos fallidos</span>
                    </div>
                    <span className="text-sm font-medium">{datos.actividad.intentos_fallidos}</span>
                  </div>
                  <Progress value={(datos.actividad.intentos_fallidos / (datos.actividad.inicios_sesion + datos.actividad.cambios_permisos + datos.actividad.cambios_configuracion + datos.actividad.intentos_fallidos)) * 100} className="h-2 bg-red-100">
                    <div className="h-2 bg-red-500" style={{ width: `${(datos.actividad.intentos_fallidos / (datos.actividad.inicios_sesion + datos.actividad.cambios_permisos + datos.actividad.cambios_configuracion + datos.actividad.intentos_fallidos)) * 100}%` }}></div>
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
            {datos.actividad_reciente.slice(0, 4).map((actividad) => {
              const iconConfig = {
                'usuario_creado': { bg: 'bg-blue-100', icon: UserCheck, color: 'text-blue-600' },
                'rol_modificado': { bg: 'bg-amber-100', icon: ShieldCheck, color: 'text-amber-600' },
                'usuario_desactivado': { bg: 'bg-red-100', icon: UserX, color: 'text-red-600' },
                'politica_actualizada': { bg: 'bg-green-100', icon: FileText, color: 'text-green-600' },
                'permiso_modificado': { bg: 'bg-purple-100', icon: Lock, color: 'text-purple-600' },
                'login_fallido': { bg: 'bg-red-100', icon: AlertTriangle, color: 'text-red-600' },
              }
              const config = iconConfig[actividad.tipo] || iconConfig['permiso_modificado']
              const Icon = config.icon

              return (
                <div key={actividad.id} className="flex items-start space-x-4">
                  <div className={`${config.bg} p-2 rounded-full`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{actividad.titulo}</p>
                    <p className="text-xs text-muted-foreground">{actividad.descripcion}</p>
                    <p className="text-xs text-muted-foreground">{actividad.tiempo_relativo}</p>
                  </div>
                </div>
              )
            })}
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
        </TabsList>

        <TabsContent value="alertas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Seguridad</CardTitle>
              <CardDescription>Eventos detectados automáticamente que requieren atención</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {datos.alertas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No hay alertas de seguridad en este momento</p>
                </div>
              ) : (
                datos.alertas.map((alerta) => {
                  const iconConfig = {
                    critico: { bg: 'bg-red-100', icon: AlertTriangle, color: 'text-red-600' },
                    alto: { bg: 'bg-amber-100', icon: ShieldAlert, color: 'text-amber-600' },
                    medio: { bg: 'bg-yellow-100', icon: Clock, color: 'text-yellow-600' },
                    bajo: { bg: 'bg-blue-100', icon: Eye, color: 'text-blue-600' },
                  }
                  const config = iconConfig[alerta.nivel]
                  const Icon = config.icon

                  return (
                    <div key={alerta.id} className="flex items-start space-x-4">
                      <div className={`${config.bg} p-2 rounded-full`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium">{alerta.titulo}</p>
                        <p className="text-xs text-muted-foreground">{alerta.descripcion}</p>
                        <p className="text-xs text-muted-foreground">{alerta.tiempo_relativo}</p>
                        {alerta.requiere_accion && (
                          <div className="flex gap-2 mt-1">
                            {alerta.acciones_disponibles.includes('bloquear_ip') && (
                              <Button variant="outline" size="sm">Bloquear IP</Button>
                            )}
                            {alerta.acciones_disponibles.includes('bloquear_usuario') && (
                              <Button variant="outline" size="sm">Bloquear Usuario</Button>
                            )}
                            {alerta.acciones_disponibles.includes('investigar') && (
                              <Button size="sm">Investigar</Button>
                            )}
                            {alerta.acciones_disponibles.includes('revertir') && (
                              <Button variant="outline" size="sm">Revertir Cambio</Button>
                            )}
                            {alerta.acciones_disponibles.includes('revisar') && (
                              <Button size="sm">Revisar</Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
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
                {datos.sesiones_activas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2" />
                    <p>No hay sesiones activas en este momento</p>
                  </div>
                ) : (
                  datos.sesiones_activas.map((sesion) => {
                    const colors = ['blue', 'green', 'purple', 'amber', 'pink', 'indigo']
                    const color = colors[parseInt(sesion.id) % colors.length]
                    
                    return (
                      <div key={sesion.id} className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full bg-${color}-100 flex items-center justify-center`}>
                            <span className={`font-semibold text-${color}-600`}>{sesion.iniciales}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{sesion.usuario}</p>
                            <p className="text-xs text-muted-foreground">{sesion.rol}</p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          <p>{sesion.ip_address}</p>
                          <p>Conectado {sesion.tiempo_conectado}</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 mt-1"
                            onClick={() => cerrarSesion(sesion.id)}
                            disabled={cerrandoSesion === sesion.id}
                          >
                            {cerrandoSesion === sesion.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <LogOut className="mr-1 h-3 w-3" />
                            )}
                            Cerrar sesión
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button variant="outline" className="w-full" onClick={cerrarTodasLasSesiones}>
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

