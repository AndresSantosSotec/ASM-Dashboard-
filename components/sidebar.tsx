"use client"

import { useState, useEffect, type ReactNode } from "react"
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
import { API_BASE_URL } from "@/utils/apiConfig"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

interface SidebarProps {
  open?: boolean
  className?: string
}

export default function Sidebar({ open, className }: SidebarProps) {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<"Administrador" | "Asesor" | "">("")

  // Hacemos fetch para obtener el rol del usuario
  useEffect(() => {
    fetch(`${API_BASE_URL}/user`, {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        // data.rol debe venir como "Administrador" o "Asesor"
        setUserRole(data.rol)
      })
      .catch(() => setUserRole(""))
  }, [])

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    prospectos: false,
    inscripcion: false,
    academico: false,
    docentes: false,
    estudiantes: false,
    administracion: true,
    seguridad: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const linkClass = (href: string) =>
    `flex items-center px-4 py-1.5 rounded-md ${
      pathname === href ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
    }`

  return (
    <div
      className={`${open ? "w-64" : "w-0 -translate-x-full"} transition-all duration-300 asm-gradient border-r border-asm-medium-gold/30 flex flex-col h-full overflow-y-auto ${cn(
        "pb-12",
        className
      )}`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-asm-medium-gold/30">
        <Link href="/" className="flex items-center text-asm-light-gold font-semibold text-lg">
          <span>American School of Management</span>
        </Link>
      </div>

      <div className="flex-1 py-2 overflow-y-auto">
        {/* Inicio: siempre visible */}
        <Link href="/" className={linkClass("/")}>
          <Home size={18} className="mr-2" />
          <span>Inicio</span>
        </Link>

        {/* Prospectos y Asesores: para Administrador y Asesor */}
        {(userRole === "Administrador" || userRole === "Asesor") && (
          <>
            <div className="px-4 py-2 text-sm font-medium text-asm-light-gold/70">Módulos</div>
            <div className="mb-1">
              <button
                onClick={() => toggleSection("prospectos")}
                className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md"
              >
                <div className="flex items-center">
                  <Users size={18} className="mr-2" />
                  <span>Prospectos y Asesores</span>
                </div>
                {expandedSections.prospectos ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {expandedSections.prospectos && (
                <div className="pl-10 text-sm space-y-1">
                  <Link href="/gestion" className={linkClass("/gestion")}>
                    <Users size={16} className="mr-2" />
                    Gestión de Prospectos
                  </Link>
                  <Link href="/captura" className={linkClass("/captura")}>
                    <Plus size={16} className="mr-2" />
                    Captura de Prospectos
                  </Link>
                  <Link href="/leads-asignados" className={linkClass("/leads-asignados")}>
                    <FileText size={16} className="mr-2" />
                    Leads Asignados
                  </Link>
                  <Link href="/seguimiento" className={linkClass("/seguimiento")}>
                    <ClipboardList size={16} className="mr-2" />
                    Panel de Seguimiento
                  </Link>
                  <Link href="/importar-leads" className={linkClass("/importar-leads")}>
                    <FileText size={16} className="mr-2" />
                    Importar Leads
                  </Link>

                  <div className="mt-2 mb-1 px-4 py-1 text-xs font-medium text-asm-light-gold/70">
                    Activities
                  </div>
                  <Link href="/correos" className={linkClass("/correos")}>
                    <Mail size={16} className="mr-2" />
                    Correos
                  </Link>
                  <Link href="/calendario" className={linkClass("/calendario")}>
                    <Calendar size={16} className="mr-2" />
                    Calendario
                  </Link>

                  <div className="mt-2 mb-1 px-4 py-1 text-xs font-medium text-asm-light-gold/70">
                    Integraciones
                  </div>
                  <Link href="/envio-correos" className={linkClass("/envio-correos")}>
                    <Mail size={16} className="mr-2" />
                    Formulario de Correos
                  </Link>
                  <Link href="/programacion-tareas" className={linkClass("/programacion-tareas")}>
                    <Calendar size={16} className="mr-2" />
                    Programación de Tareas
                  </Link>
                </div>
              )}
            </div>
          </>
        )}

        {/* Resto de secciones: solo Administrador */}
        {userRole === "Administrador" && (
          <>
            {/* Inscripción */}
            <div className="mb-1">
              <button
                onClick={() => toggleSection("inscripcion")}
                className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md"
              >
                <FileText size={18} className="mr-2" />
                <span>Inscripción</span>
                {expandedSections.inscripcion ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {expandedSections.inscripcion && (
                <div className="pl-10 text-sm space-y-1">
                  <Link href="/inscripcion/ficha" className={linkClass("/inscripcion/ficha")}>
                    <FileText size={16} className="mr-2" />
                    Ficha de Inscripción
                  </Link>
                  <Link href="/inscripcion/revision" className={linkClass("/inscripcion/revision")}>
                    <FileText size={16} className="mr-2" />
                    Revisión de Fichas
                  </Link>
                  <Link href="/firma" className={linkClass("/firma")}>
                    <FileSignature size={16} className="mr-2" />
                    Firma Digital
                  </Link>
                </div>
              )}
            </div>

            {/* Académico */}
            <div className="mb-1">
              <button
                onClick={() => toggleSection("academico")}
                className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md"
              >
                <BookOpen size={18} className="mr-2" />
                <span>Académico</span>
                {expandedSections.academico ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {expandedSections.academico && (
                <div className="pl-10 text-sm">
                  <Link href="/academico/programas" className={linkClass("/academico/programas")}>
                    <BookOpen size={16} className="mr-2" />
                    Programas Académicos
                  </Link>
                </div>
              )}
            </div>

            {/* Docentes */}
            <div className="mb-1">
              <button
                onClick={() => toggleSection("docentes")}
                className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md"
              >
                <GraduationCapIcon size={18} className="mr-2" />
                <span>Docentes</span>
                {expandedSections.docentes ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {expandedSections.docentes && (
                <div className="pl-10 text-sm">
                  <Link href="/docente" className={linkClass("/docente")}>
                    <LayoutDashboard size={16} className="mr-2" />
                    Portal Docente
                  </Link>
                </div>
              )}
            </div>

            {/* Estudiantes */}
            <div className="mb-1">
              <button
                onClick={() => toggleSection("estudiantes")}
                className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md"
              >
                <Users size={18} className="mr-2" />
                <span>Estudiantes</span>
                {expandedSections.estudiantes ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {expandedSections.estudiantes && (
                <div className="pl-10 text-sm">
                  <Link href="/estudiantes" className={linkClass("/estudiantes")}>
                    <LayoutDashboard size={16} className="mr-2" />
                    Dashboard Estudiantil
                  </Link>
                </div>
              )}
            </div>

            {/* Administración */}
            <div className="mb-1">
              <button
                onClick={() => toggleSection("administracion")}
                className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md"
              >
                <Building size={18} className="mr-2" />
                <span>Administración</span>
                {expandedSections.administracion ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {expandedSections.administracion && (
                <div className="pl-10 text-sm">
                  <Link href="/admin" className={linkClass("/admin")}>
                    <LayoutDashboard size={16} className="mr-2" />
                    Dashboard Administrativo
                  </Link>
                </div>
              )}
            </div>

            {/* Seguridad */}
            <div className="mb-1">
              <button
                onClick={() => toggleSection("seguridad")}
                className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md"
              >
                <Shield size={18} className="mr-2" />
                <span>Seguridad</span>
                {expandedSections.seguridad ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {expandedSections.seguridad && (
                <div className="pl-10 text-sm">
                  <Link href="/seguridad/usuarios" className={linkClass("/seguridad/usuarios")}>
                    <Users size={16} className="mr-2" />
                    Usuarios
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
