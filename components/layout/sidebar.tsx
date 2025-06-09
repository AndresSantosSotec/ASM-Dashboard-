"use client"

import React, { useState } from "react"
import {
  BarChart2,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  Home,
  Mail,
  Settings,
  Shield,
  Users,
  DollarSign,
  BookOpen,
  ClipboardList,
  Activity,
  UserCheck,
  Plus,
  FileSignature,
  BarChart,
  LayoutDashboard,
  GraduationCapIcon,
  CreditCard,
  Bell,
  Award,
  Medal,
  PieChart,
  RefreshCw,
  Phone,
  FileCheck,
  Send,
  Key,
  LogIn,
  Clock,
  LogOut
} from "lucide-react"
import Link from "next/link"
import axios from "axios"
import { API_BASE_URL } from "@/utils/apiConfig"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import { useUserPermissions, hasPermission } from "@/hooks/obtener_permisos"

interface SidebarProps {
  open?: boolean
  className?: string
}

interface SectionLink {
  title: string
  href: string
  icon: LucideIcon
  permissionPath: string
}

interface Section {
  key: string
  title: string
  icon: LucideIcon
  links: SectionLink[]
}

export default function Sidebar({ open, className }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const permissions = useUserPermissions()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const CONTEO_REVISADAS_KEY = "fichasRevisadasCount"

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const sections: Section[] = [
    {
      key: "prospectos",
      title: "Prospectos y Asesores",
      icon: Users,
      links: [
        { title: "Gestión de Prospectos", href: "/gestion", icon: Users, permissionPath: "/gestion" },
        { title: "Captura de Prospectos", href: "/captura", icon: Plus, permissionPath: "/captura" },
        { title: "Leads Asignados", href: "/leads-asignados", icon: FileText, permissionPath: "/leads-asignados" },
        { title: "Panel de Seguimiento", href: "/seguimiento", icon: ClipboardList, permissionPath: "/seguimiento" },
        { title: "Importar Leads", href: "/importar-leads", icon: FileText, permissionPath: "/importar-leads" },
        { title: "Correos", href: "/correos", icon: Mail, permissionPath: "/correos" },
        { title: "Calendario", href: "/calendario", icon: Calendar, permissionPath: "/calendario" },
        { title: "Panel de Administración", href: "/admin", icon: Users, permissionPath: "/admin" }
      ]
    },
    {
      key: "inscripcion",
      title: "Inscripción",
      icon: FileText,
      links: [
        { title: "Ficha de Inscripción", href: "/inscripcion/ficha", icon: FileText, permissionPath: "/inscripcion/ficha" },
        { title: "Revisión de Fichas", href: "/inscripcion/revision", icon: FileText, permissionPath: "/inscripcion/revision" },
        { title: "Firma Digital", href: "/firma", icon: FileSignature, permissionPath: "/firma" },
        { title: "Validación de Documentos", href: "/documentos", icon: FileText, permissionPath: "/documentos" },
        { title: "Periodos de Inscripción", href: "/inscripcion/admin/periodos", icon: Calendar, permissionPath: "/inscripcion/admin/periodos" },
        { title: "Flujos de Aprobación", href: "/inscripcion/admin/flujos", icon: Activity, permissionPath: "/inscripcion/admin/flujos" }
      ]
    },
    {
      key: "academico",
      title: "Académico",
      icon: BookOpen,
      links: [
        { title: "Programas Académicos", href: "/academico/programas", icon: BookOpen, permissionPath: "/academico/programas" },
        { title: "Gestión de Estudiante", href: "/academico/usuarios", icon: Users, permissionPath: "/academico/usuarios" },
        { title: "Programación de Cursos", href: "/academico/programacion", icon: Calendar, permissionPath: "/academico/programacion" },
        { title: "Asignación de Cursos", href: "/academico/asignacion", icon: ClipboardList, permissionPath: "/academico/asignacion" },
        { title: "Estatus Académico", href: "/academico/estatus-alumno", icon: UserCheck, permissionPath: "/academico/estatus-alumno" },
        { title: "Ranking Académico", href: "/academico/ranking", icon: BarChart2, permissionPath: "/academico/ranking" }
      ]
    },
    {
      key: "docentes",
      title: "Docentes",
      icon: GraduationCapIcon,
      links: [
        { title: "Portal Docente", href: "/docente", icon: LayoutDashboard, permissionPath: "/docente" },
        { title: "Mis Cursos", href: "/docente/cursos", icon: BookOpen, permissionPath: "/docente/cursos" },
        { title: "Alumnos", href: "/docente/alumnos", icon: Users, permissionPath: "/docente/alumnos" },
        { title: "Material Didáctico", href: "/docente/material", icon: FileText, permissionPath: "/docente/material" },
        { title: "Mensajería e Invitaciones", href: "/docente/mensajes", icon: Mail, permissionPath: "/docente/mensajes" },
        { title: "Medallero e Insignias", href: "/docente/medallero", icon: Medal, permissionPath: "/docente/medallero" },
        { title: "Mi Aprendizaje", href: "/docente/mi-aprendizaje", icon: BookOpen, permissionPath: "/docente/mi-aprendizaje" },
        { title: "Calendario", href: "/docente/calendario", icon: Calendar, permissionPath: "/docente/calendario" },
        { title: "Notificaciones", href: "/docente/notificaciones", icon: Bell, permissionPath: "/docente/notificaciones" },
        { title: "Certificaciones", href: "/docente/certificaciones", icon: Award, permissionPath: "/docente/certificaciones" }
      ]
    },
    {
      key: "estudiantes",
      title: "Estudiantes",
      icon: Users,
      links: [
        { title: "Dashboard Estudiantil", href: "/estudiantes", icon: LayoutDashboard, permissionPath: "/estudiantes" },
        { title: "Documentos", href: "/estudiantes/documentos", icon: FileText, permissionPath: "/estudiantes/documentos" },
        { title: "Gestión de Pagos", href: "/estudiantes/pagos", icon: DollarSign, permissionPath: "/estudiantes/pagos" },
        { title: "Ranking Estudiantil", href: "/estudiantes/ranking", icon: Award, permissionPath: "/estudiantes/ranking" },
        { title: "Calendario Académico", href: "/estudiantes/calendario", icon: Calendar, permissionPath: "/estudiantes/calendario" },
        { title: "Notificaciones", href: "/estudiantes/notificaciones", icon: Bell, permissionPath: "/estudiantes/notificaciones" },
        { title: "Mi Perfil", href: "/estudiantes/perfil", icon: UserCheck, permissionPath: "/estudiantes/perfil" },
        { title: "Estado de Cuenta", href: "/estudiantes/estado-cuenta", icon: CreditCard, permissionPath: "/estudiantes/estado-cuenta" },
        { title: "Chat Docente", href: "/estudiantes/chat-docente", icon: Mail, permissionPath: "/estudiantes/chat-docente" }
      ]
    },
    {
      key: "finanzas",
      title: "Finanzas y Pagos",
      icon: DollarSign,
      links: [
        { title: "Dashboard Financiero", href: "/finanzas/dashboard", icon: PieChart, permissionPath: "/finanzas/dashboard" },
        { title: "Estado de Cuenta", href: "/finanzas/estado-cuenta", icon: FileText, permissionPath: "/finanzas/estado-cuenta" },
        { title: "Gestión de Pagos", href: "/finanzas/gestion-pagos", icon: CreditCard, permissionPath: "/finanzas/gestion-pagos" },
        { title: "Conciliación Bancaria", href: "/finanzas/conciliacion", icon: RefreshCw, permissionPath: "/finanzas/conciliacion" },
        { title: "Seguimiento de Cobros", href: "/finanzas/seguimiento-cobros", icon: Phone, permissionPath: "/finanzas/seguimiento-cobros" },
        { title: "Reportes Financieros", href: "/finanzas/reportes", icon: BarChart, permissionPath: "/finanzas/reportes" },
        { title: "Configuración", href: "/finanzas/configuracion", icon: Settings, permissionPath: "/finanzas/configuracion" }
      ]
    },
    {
      key: "administracion",
      title: "Administración",
      icon: Settings,
      links: [
        { title: "Dashboard Administrativo", href: "/admin/dashboard", icon: LayoutDashboard, permissionPath: "/admin/dashboard" },
        { title: "Programación de Cursos", href: "/admin/programacion-cursos", icon: Calendar, permissionPath: "/admin/programacion-cursos" },
        { title: "Reportes de Matrícula", href: "/admin/reportes-matricula", icon: FileCheck, permissionPath: "/admin/reportes-matricula" },
        { title: "Reporte de Graduaciones", href: "/admin/reporte-graduaciones", icon: GraduationCapIcon, permissionPath: "/admin/reporte-graduaciones" },
        { title: "Plantillas y Mailing", href: "/admin/plantillas-mailing", icon: Send, permissionPath: "/admin/plantillas-mailing" },
        { title: "Configuración General", href: "/admin/configuracion", icon: Settings, permissionPath: "/admin/configuracion" }
      ]
    },
    {
      key: "seguridad",
      title: "Seguridad",
      icon: Shield,
      links: [
        { title: "Dashboard Seguridad", href: "/seguridad/dashboard", icon: LayoutDashboard, permissionPath: "/seguridad/dashboard" },
        { title: "Autenticación 2FA", href: "/seguridad/2fa", icon: Key, permissionPath: "/seguridad/2fa" },
        { title: "Accesos", href: "/seguridad/accesos", icon: LogIn, permissionPath: "/seguridad/accesos" },
        { title: "Auditoría", href: "/seguridad/auditoria", icon: Activity, permissionPath: "/seguridad/auditoria" },
        { title: "Políticas", href: "/seguridad/politicas", icon: FileText, permissionPath: "/seguridad/politicas" },
        { title: "Roles", href: "/seguridad/roles", icon: Users, permissionPath: "/seguridad/roles" },
        { title: "Sesiones", href: "/seguridad/sesiones", icon: Clock, permissionPath: "/seguridad/sesiones" },
        { title: "Usuarios", href: "/seguridad/usuarios", icon: UserCheck, permissionPath: "/seguridad/usuarios" },
        { title: "Permisos", href: "/seguridad/permisos", icon: Shield, permissionPath: "/seguridad/permisos" }
      ]
    }
  ]

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token")
      if (token) {
        await axios.post(
          `${API_BASE_URL}/api/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      }
    } catch (error) {
      console.error("Error al hacer logout:", error)
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      localStorage.removeItem(CONTEO_REVISADAS_KEY)
      router.push("/login")
    }
  }

  return (
    <div
      className={`${open ? "w-64" : "w-0 -translate-x-full"} transition-all duration-300 asm-gradient border-r border-asm-medium-gold/30 flex flex-col h-full overflow-y-auto ${cn("pb-12", className)}`}
    >
      <div className="p-4 border-b border-asm-medium-gold/30 flex justify-center">
        <Link href="/" className="flex flex-col items-center">
          <div className="w-12 h-12 bg-asm-light-gold rounded-full mb-2 flex items-center justify-center">
            <span className="text-asm-navy font-bold text-xl">ASM</span>
          </div>
          <span className="text-asm-light-gold font-semibold text-sm text-center">
            American School of Management
          </span>
        </Link>
      </div>

      <div className="flex-1 py-4 overflow-y-auto px-3">
        <Link
          href="/"
          className={`flex items-center px-4 py-2 mb-2 rounded-md ${pathname === "/" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"} transition-colors duration-200`}
        >
          <Home size={18} className="mr-2" />
          <span>Inicio</span>
        </Link>

        <div className="px-4 py-2 text-xs font-medium text-asm-light-gold/70 uppercase tracking-wider">
          Módulos
        </div>

        {sections.map((section) => (
          <div key={section.key} className="mb-1">
            <button
              onClick={() => toggleSection(section.key)}
              className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md transition-colors duration-200"
            >
              <div className="flex items-center">
                <section.icon size={18} className="mr-2" />
                <span>{section.title}</span>
              </div>
              {expandedSections[section.key] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {expandedSections[section.key] && (
              <div className="pl-6 text-sm space-y-1 mt-1 mb-2">
                {section.links
                  .filter((l) => hasPermission(permissions, l.permissionPath))
                  .map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={`flex items-center px-4 py-1.5 rounded-md ${
                        pathname === l.href || pathname.startsWith(`${l.href}/`)
                          ? "bg-asm-medium-gold text-white"
                          : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                      } transition-colors duration-200`}
                    >
                      <l.icon size={16} className="mr-2" />
                      <span>{l.title}</span>
                    </Link>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-auto p-4 border-t border-asm-medium-gold/30">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 rounded-md text-red-400 hover:bg-red-500/10 transition-colors duration-200"
        >
          <LogOut size={18} className="mr-2" />
          <span>Cerrar Sesión</span>
        </button>
        <div className="flex items-center text-asm-light-gold text-xs mt-4">
          <Settings size={14} className="mr-2" />
          <span>American School of Management © 2025</span>
        </div>
      </div>
    </div>
  )
}
