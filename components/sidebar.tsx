"use client"

import { useState, type ReactNode } from "react"
import {
  BarChart2,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  Home,
  Mail,
  Settings,
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
  Building,
  Shield,
  PieChart,
  LineChart,
  UserCog,
  Database,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

interface SidebarProps {
  open?: boolean
  className?: string
}

interface SidebarItem {
  title: string
  href: string
  icon: ReactNode
  variant: "default" | "ghost"
}

export default function Sidebar({ open, className }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get("tab")

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    prospectos: false,
    inscripcion: false,
    documentos: false,
    academico: false,
    docentes: false,
    estudiantes: false,
    finanzas: false,
    administracion: true, // Abierto por defecto para mostrar las nuevas opciones
    seguridad: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const sidebarItems: SidebarItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      variant: "default",
    },
    {
      title: "Usuarios",
      href: "/usuarios",
      icon: <Users className="h-5 w-5" />,
      variant: "ghost",
    },
    {
      title: "Académico",
      href: "/academico",
      icon: <BookOpen className="h-5 w-5" />,
      variant: "ghost",
    },
    {
      title: "Docentes",
      href: "/docente",
      icon: <GraduationCapIcon className="h-5 w-5" />,
      variant: "ghost",
    },
    {
      title: "Administrativo",
      href: "/administrativo",
      icon: <Building className="h-5 w-5" />,
      variant: "ghost",
    },
    {
      title: "Finanzas y Pagos",
      href: "/finanzas-pagos",
      icon: <DollarSign className="h-5 w-5" />,
      variant: "ghost",
    },
    {
      title: "Reportes",
      href: "/reportes",
      icon: <BarChart className="h-5 w-5" />,
      variant: "ghost",
    },
    {
      title: "Calendario",
      href: "/calendario",
      icon: <Calendar className="h-5 w-5" />,
      variant: "ghost",
    },
    {
      title: "Documentos",
      href: "/documentos",
      icon: <FileText className="h-5 w-5" />,
      variant: "ghost",
    },
    {
      title: "Configuración",
      href: "/configuracion",
      icon: <Settings className="h-5 w-5" />,
      variant: "ghost",
    },
  ]

  return (
    <div
      className={`${open ? "w-64" : "w-0 -translate-x-full"} transition-all duration-300 asm-gradient border-r border-asm-medium-gold/30 flex flex-col h-full overflow-y-auto ${cn("pb-12", className)}`}
    >
      <div className="p-4 border-b border-asm-medium-gold/30">
        <Link href="/" className="flex items-center text-asm-light-gold font-semibold text-lg">
          <span>American School of Management</span>
        </Link>
      </div>

      <div className="flex-1 py-2 overflow-y-auto">
        <Link
          href="/"
          className={`flex items-center px-4 py-2 mx-2 mb-2 rounded-md ${pathname === "/" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
        >
          <Home size={18} className="mr-2" />
          <span>Inicio</span>
        </Link>
        <div className="px-4 py-2 text-sm font-medium text-asm-light-gold/70">Módulos</div>
        {/* Prospectos y Asesores (expandible) - Ahora sin el Admin Panel */};
        <div className="mb-1">
          <button
            onClick={() => toggleSection("prospectos")}
            className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md"
          >
            <div className="flex items-center">
              <Users size={18} className="mr-2" />
              <span>Prospectos y Asesores</span>
            </div>
            {expandedSections["prospectos"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedSections["prospectos"] && (
            <div className="pl-10 text-sm">
              <Link
                href="/gestion"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/gestion" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <Users size={16} className="mr-2" />
                <span>Gestión de Prospectos</span>
              </Link>
              <Link
                href="/captura"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/captura" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <Plus size={16} className="mr-2" />
                <span>Captura de Prospectos</span>
              </Link>
              <Link
                href="/leads-asignados"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/leads-asignados" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <FileText size={16} className="mr-2" />
                <span>Leads Asignados</span>
              </Link>
              <Link
                href="/seguimiento"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/seguimiento" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <ClipboardList size={16} className="mr-2" />
                <span>Panel de Seguimiento</span>
              </Link>
              <Link
                href="/importar-leads"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/importar-leads" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <FileText size={16} className="mr-2" />
                <span>Importar Leads</span>
              </Link>
              {/* <Link
                href="/interacciones-leads"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/interacciones-leads" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <Users size={16} className="mr-2" />
                <span>Interacciones con Leads</span>
              </Link> */}


              {/* Activities ahora dentro de Prospectos y Asesores */}
              <div className="mt-2 mb-1 px-4 py-1 text-xs font-medium text-asm-light-gold/70">Activities</div>
              <Link
                href="/correos"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/correos" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <Mail size={16} className="mr-2" />
                <span>Correos</span>
              </Link>
              <Link
                href="/calendario"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/calendario" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <Calendar size={16} className="mr-2" />
                <span>Calendario</span>
              </Link>

              {/* Integraciones */}
              <div className="mt-2 mb-1 px-4 py-1 text-xs font-medium text-asm-light-gold/70">Integraciones</div>
              <Link
                href="/envio-correos"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/envio-correos" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <Mail size={16} className="mr-2" />
                <span>Formulario de Correos</span>
              </Link>
              <Link
                href="/programacion-tareas"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/programacion-tareas" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <Calendar size={16} className="mr-2" />
                <span>Programación de Tareas</span>
              </Link>
            </div>
          )}
        </div>
        {/* Inscripción (expandible) */};
        <div className="mb-1">
          <button
            onClick={() => toggleSection("inscripcion")}
            className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md"
          >
            <div className="flex items-center">
              <FileText size={18} className="mr-2" />
              <span>Inscripción</span>
            </div>
            {expandedSections["inscripcion"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedSections["inscripcion"] && (
            <div className="pl-10 text-sm">
              <Link
                href="/inscripcion/ficha"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/inscripcion/ficha" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <FileText size={16} className="mr-2" />
                <span>Ficha de Inscripción</span>
              </Link>
              <Link
                href="/inscripcion/revision"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/inscripcion/revision" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <FileText size={16} className="mr-2" />
                <span>Revisión de Fichas</span>
              </Link>
              <Link
                href="/firma"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/firma" || pathname.startsWith("/firma/") ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <FileSignature size={16} className="mr-2" />
                <span>Firma Digital</span>
              </Link>
              <div className="mt-2 mb-1 px-4 py-1 text-xs font-medium text-asm-light-gold/70">Documentos</div>
              <Link
                href="/documentos"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/documentos" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <FileText size={16} className="mr-2" />
                <span>Validación de Documentos</span>
              </Link>
              <Link
                href="/documentos/gestion"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/documentos/gestion" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <FileText size={16} className="mr-2" />
                <span>Gestión de Documentos</span>
              </Link>
              <div className="mt-2 mb-1 px-4 py-1 text-xs font-medium text-asm-light-gold/70">Reportes</div>
              <Link
                href="/reportes-avanzados"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/reportes-avanzados" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <BarChart size={16} className="mr-2" />
                <span>Reportes Avanzados</span>
              </Link>
              <div className="mt-2 mb-1 px-4 py-1 text-xs font-medium text-asm-light-gold/70">Administración</div>
              <Link
                href="/inscripcion/admin/periodos"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/inscripcion/admin/periodos" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <Calendar size={16} className="mr-2" />
                <span>Periodos de Inscripción</span>
              </Link>
              <Link
                href="/inscripcion/admin/flujos"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/inscripcion/admin/flujos" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <Activity size={16} className="mr-2" />
                <span>Flujos de Aprobación</span>
              </Link>
            </div>
          )}
        </div>
        {/* Académico (expandible) */};
        <div className="mb-1">
          <button
            onClick={() => toggleSection("academico")}
            className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md"
          >
            <div className="flex items-center">
              <BookOpen size={18} className="mr-2" />
              <span>Académico</span>
            </div>
            {expandedSections["academico"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedSections["academico"] && (
            <div className="pl-10 text-sm">
              <Link
                href="/academico/programas"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/academico/programas" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <BookOpen size={16} className="mr-2" />
                <span>Programas Académicos</span>
              </Link>
              <Link
                href="/academico/usuarios"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/academico/usuarios" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <Users size={16} className="mr-2" />
                <span>Gestión de Usuarios</span>
              </Link>
              <Link
                href="/academico/programacion"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/academico/programacion" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <Calendar size={16} className="mr-2" />
                <span>Programación de Cursos</span>
              </Link>
              <Link
                href="/academico/asignacion"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/academico/asignacion" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <ClipboardList size={16} className="mr-2" />
                <span>Asignación de Cursos</span>
              </Link>
              <Link
                href="/academico/estatus-alumno"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/academico/estatus-alumno" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <UserCheck size={16} className="mr-2" />
                <span>Estatus Académico</span>
              </Link>
              <Link
                href="/academico/estado-sistema"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/academico/estado-sistema" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <Activity size={16} className="mr-2" />
                <span>Estatus General</span>
              </Link>
              <Link
                href="/academico/ranking"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/academico/ranking" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <BarChart2 size={16} className="mr-2" />
                <span>Ranking Académico</span>
              </Link>
            </div>
          )}
        </div>
        {/* Docentes (expandible) */};
        <div className="mb-1">
          <button
            onClick={() => toggleSection("docentes")}
            className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md"
          >
            <div className="flex items-center">
              <GraduationCapIcon size={18} className="mr-2" />
              <span>Docentes</span>
            </div>
            {expandedSections["docentes"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedSections["docentes"] && (
            <div className="pl-10 text-sm">
              <Link
                href="/docente"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/docente" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <LayoutDashboard size={16} className="mr-2" />
                <span>Portal Docente</span>
              </Link>
              {/* Additional docente links would go here */}
            </div>
          )}
        </div>
        {/* Estudiantes (expandible) */};
        <div className="mb-1">
          <button
            onClick={() => toggleSection("estudiantes")}
            className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md"
          >
            <div className="flex items-center">
              <Users size={18} className="mr-2" />
              <span>Estudiantes</span>
            </div>
            {expandedSections["estudiantes"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedSections["estudiantes"] && (
            <div className="pl-10 text-sm">
              <Link
                href="/estudiantes"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/estudiantes" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <LayoutDashboard size={16} className="mr-2" />
                <span>Dashboard Estudiantil</span>
              </Link>
              {/* Additional estudiantes links would go here */}
            </div>
          )}
        </div>
        {/* NUEVA SECCIÓN: Administración (expandible) */};
        <div className="mb-1">
          <button
            onClick={() => toggleSection("administracion")}
            className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md"
          >
            <div className="flex items-center">
              <Building size={18} className="mr-2" />
              <span>Administración</span>
            </div>
            {expandedSections["administracion"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedSections["administracion"] && (
            <div className="pl-10 text-sm">
              {/* Panel principal */}
              <Link
                href="/admin"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/admin" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <LayoutDashboard size={16} className="mr-2" />
                <span>Dashboard Administrativo</span>
              </Link>

              {/* Reportes Avanzados */}
              <div className="mt-2 mb-1 px-4 py-1 text-xs font-medium text-asm-light-gold/70">Reportes Avanzados</div>

              <Link
                href="/admin/reportes-matricula"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/admin/reportes-matricula" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <PieChart size={16} className="mr-2" />
                <span>Reportes de Matrícula</span>
              </Link>

              <Link
                href="/admin/matriculados-por-mes"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/admin/matriculados-por-mes" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <LineChart size={16} className="mr-2" />
                <span>Matriculados por Mes</span>
              </Link>

              <Link
                href="/admin/alumnos-nuevos-por-mes"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/admin/alumnos-nuevos-por-mes" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <BarChart size={16} className="mr-2" />
                <span>Alumnos Nuevos por Mes</span>
              </Link>

              <Link
                href="/admin/reporte-graduaciones"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/admin/reporte-graduaciones" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <GraduationCapIcon size={16} className="mr-2" />
                <span>Reporte de Graduaciones</span>
              </Link>

              <Link
                href="/admin/reporteria-general"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/admin/reporteria-general" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <Database size={16} className="mr-2" />
                <span>Reportería General</span>
              </Link>

              {/* Configuración del Sistema */}
              <div className="mt-2 mb-1 px-4 py-1 text-xs font-medium text-asm-light-gold/70">
                Configuración del Sistema
              </div>

              <Link
                href="/admin/configuracion"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/admin/configuracion" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <Settings size={16} className="mr-2" />
                <span>Configuración General</span>
              </Link>

              <Link
                href="/admin/usuarios"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/admin/usuarios" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <UserCog size={16} className="mr-2" />
                <span>Gestión de Usuarios</span>
              </Link>
            </div>
          )}
        </div>
        {/* Seguridad (expandible) */};
        <div className="mb-1">
          <button
            onClick={() => toggleSection("seguridad")}
            className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md"
          >
            <div className="flex items-center">
              <Shield size={18} className="mr-2" />
              <span>Seguridad</span>
            </div>
            {expandedSections["seguridad"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedSections["seguridad"] && (
            <div className="pl-10 text-sm">
              <Link
                href="/seguridad/usuarios"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/seguridad/usuarios" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <Users size={16} className="mr-2" />
                <span>Usuarios</span>
              </Link>
              <Link
                href="/seguridad/roles"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/seguridad/roles" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <UserCog size={16} className="mr-2" />
                <span>Roles y Permisos</span>
              </Link>
              <Link
                href="/seguridad/auditoria"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/seguridad/auditoria" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
              >
                <AlertTriangle size={16} className="mr-2" />
                <span>Auditoría</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

