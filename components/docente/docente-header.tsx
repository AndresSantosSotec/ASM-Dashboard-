"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, Calendar, Mail } from "lucide-react"
import Link from "next/link"

export function DocenteHeader() {
  return (
    <div className="mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Avatar" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">Bienvenido, Dr. Juan Docente</h1>
                <p className="text-muted-foreground">Facultad de Ciencias Económicas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notificaciones</span>
              </Button>
              <Button variant="outline" size="icon">
                <Mail className="h-5 w-5" />
                <span className="sr-only">Mensajes</span>
              </Button>
              <Button variant="outline" size="icon">
                <Calendar className="h-5 w-5" />
                <span className="sr-only">Calendario</span>
              </Button>
              <Link href="/docente/perfil">
                <Button>Mi Perfil</Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-700">Cursos Activos</h3>
              <p className="text-2xl font-bold">3</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-700">Estudiantes</h3>
              <p className="text-2xl font-bold">87</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <h3 className="font-medium text-amber-700">Próxima Clase</h3>
              <p className="text-lg font-medium">Hoy, 14:00 - 16:00</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

