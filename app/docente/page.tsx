import type { Metadata } from "next"
import { Calendar, Mail, Award, BookOpen, FileText, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { DocenteHeader } from "@/components/docente/docente-header"

export const metadata: Metadata = {
  title: "Portal Docente | Blue Atlas",
  description: "Portal centralizado para docentes",
}

// Datos de ejemplo
const notifications = [
  {
    id: 1,
    title: "Recordatorio: Cierre de curso",
    description: "El curso 'Metodología de la Investigación' finaliza en 3 días",
    date: "2023-11-15",
    type: "reminder",
  },
  {
    id: 2,
    title: "Pendiente: Subir acta de calificaciones",
    description: "Se requiere subir el acta del curso 'Estadística Aplicada'",
    date: "2023-11-14",
    type: "alert",
  },
  {
    id: 3,
    title: "Invitación: Nuevo curso",
    description: "Ha sido invitado a impartir el curso 'Análisis de Datos'",
    date: "2023-11-13",
    type: "invitation",
  },
]

const upcomingEvents = [
  {
    id: 1,
    title: "Taller de Actualización Docente",
    date: "2023-11-20",
    time: "10:00 - 12:00",
    location: "Aula Virtual 3",
  },
  {
    id: 2,
    title: "Reunión de Academia",
    date: "2023-11-22",
    time: "15:00 - 16:30",
    location: "Sala de Juntas",
  },
  {
    id: 3,
    title: "Diplomado en Innovación Educativa",
    date: "2023-11-25",
    time: "09:00 - 14:00",
    location: "Centro de Capacitación",
  },
]

export default function DocentePortal() {
  const quickAccess = [
    {
      title: "Mis Cursos",
      href: "/docente/cursos",
      icon: <BookOpen className="h-6 w-6" />,
      description: "Ver y gestionar cursos asignados",
    },
    {
      title: "Alumnos",
      href: "/docente/alumnos",
      icon: <Users className="h-6 w-6" />,
      description: "Lista de estudiantes y calificaciones",
    },
    {
      title: "Material Didáctico",
      href: "/docente/material",
      icon: <FileText className="h-6 w-6" />,
      description: "Gestionar recursos educativos",
    },
    {
      title: "Mensajes",
      href: "/docente/mensajes",
      icon: <Mail className="h-6 w-6" />,
      description: "Comunicación con estudiantes",
    },
    {
      title: "Certificaciones",
      href: "/docente/certificaciones",
      icon: <Award className="h-6 w-6" />,
      description: "Ver certificaciones disponibles",
    },
    {
      title: "Calendario",
      href: "/docente/calendario",
      icon: <Calendar className="h-6 w-6" />,
      description: "Horarios y eventos",
    },
  ]

  return (
    <div className="container py-6">
      <DocenteHeader />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickAccess.map((item, index) => (
          <Link key={index} href={item.href}>
            <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">{item.icon}</div>
                <div>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

