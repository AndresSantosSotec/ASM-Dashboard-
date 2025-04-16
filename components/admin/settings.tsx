"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export function Settings() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-2">Gestión de Usuarios</h3>
            <div className="space-y-2">
              {/* Navega a "/seguridad/usuarios-agregar" al presionar este botón */}
              <Button onClick={() => router.push("/seguridad/usuarios")}>
                Agregar Nuevo Usuario
              </Button>
              {/* Navega a "/seguridad/permisos" al presionar este botón */}
              <Button variant="outline" onClick={() => router.push("/seguridad/permisos")}>
                Gestionar Roles y Permisos
              </Button>
            </div>
          </div>

          <div className="border-t my-6 pt-6">
            <h3 className="text-lg font-semibold mb-4">Configuración de Seguimiento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Estatus por Colores</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <Label>Interesado</Label>
                    <Input className="w-32 ml-auto" defaultValue="#10B981" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <Label>En seguimiento</Label>
                    <Input className="w-32 ml-auto" defaultValue="#F59E0B" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <Label>Inscrito</Label>
                    <Input className="w-32 ml-auto" defaultValue="#3B82F6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <Label>No interesado</Label>
                    <Input className="w-32 ml-auto" defaultValue="#EF4444" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-500"></div>
                    <Label>No contactar</Label>
                    <Input className="w-32 ml-auto" defaultValue="#6B7280" />
                  </div>
                  <Button size="sm" className="mt-2">
                    Guardar Colores
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Tiempos de Alerta</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="greenAlertDays">Alerta Verde (días)</Label>
                    <div className="flex items-center gap-2">
                      <Input id="greenAlertDays" type="number" defaultValue="1" className="w-20" />
                      <span className="text-xs text-gray-500">a</span>
                      <Input type="number" defaultValue="4" className="w-20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yellowAlertDays">Alerta Amarilla (días)</Label>
                    <div className="flex items-center gap-2">
                      <Input id="yellowAlertDays" type="number" defaultValue="5" className="w-20" />
                      <span className="text-xs text-gray-500">a</span>
                      <Input type="number" defaultValue="6" className="w-20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="redAlertDays">Alerta Roja (días)</Label>
                    <div className="flex items-center gap-2">
                      <Input id="redAlertDays" type="number" defaultValue="7" className="w-20" />
                      <span className="text-xs text-gray-500">o más</span>
                    </div>
                  </div>
                </div>
                <Button size="sm" className="mt-2">
                  Guardar Tiempos
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t my-6 pt-6">
            <h3 className="text-lg font-semibold mb-4">Notificaciones y Alertas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Notificaciones Automáticas</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="weeklyNotifications" defaultChecked />
                    <Label htmlFor="weeklyNotifications">Notificaciones semanales de seguimiento</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="assignmentNotifications" defaultChecked />
                    <Label htmlFor="assignmentNotifications">Notificaciones de asignación de asesorías</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="alertSupervisor" defaultChecked />
                    <Label htmlFor="alertSupervisor">Alertar al supervisor cuando un lead no recibe seguimiento</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="dailyActivityReport" defaultChecked />
                    <Label htmlFor="dailyActivityReport">Enviar reporte de actividad diaria</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Canales de Notificación</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="emailNotifications" defaultChecked />
                    <Label htmlFor="emailNotifications">Correo electrónico</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="systemNotifications" defaultChecked />
                    <Label htmlFor="systemNotifications">Notificaciones en el sistema</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="smsNotifications" />
                    <Label htmlFor="smsNotifications">SMS (requiere configuración adicional)</Label>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="notificationTime">Hora de envío de reportes diarios</Label>
                    <Input id="notificationTime" type="time" defaultValue="18:00" className="w-32 mt-1" />
                  </div>
                </div>
              </div>
            </div>
            <Button className="mt-4">Guardar Configuración de Notificaciones</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
