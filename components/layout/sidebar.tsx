"use client"

import React, { useEffect, useState, type ReactNode } from "react"
import {
  BarChart2, Calendar, ChevronDown, ChevronRight, FileText, Home, Mail, Settings, Shield, Users, DollarSign,
  BookOpen, ClipboardList, Activity, Copy, UserCheck, Plus, FileSignature, BarChart, LayoutDashboard, GraduationCapIcon,
  CreditCard, Bell, Award, Medal, PieChart, RefreshCw, Phone, FileCheck, Send, Key, LogIn, Database, Clock, LogOut
} from "lucide-react"
import Link from "next/link"
import axios from "axios"
import { API_BASE_URL } from "@/utils/apiConfig"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Loader } from "lucide-react"

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
  const router = useRouter() // Se obtiene el router para redireccionar
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    prospectos: false,
    inscripcion: false,
    documentos: false,
    academico: false,
    docentes: false,
    estudiantes: false,
    finanzas: false,
    administracion: false,
    seguridad: false,
  })
  // Al inicio de tu componente (o en un fichero de constantes)
  const CONTEO_REVISADAS_KEY = "fichasRevisadasCount";


  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Realiza la llamada a la API para obtener los detalles del usuario
  useEffect(() => {
    const fetchUserDetails = async () => {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/users`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          if (response.status === 200) {
            const user = response.data.find((u: any) => u.id === JSON.parse(localStorage.getItem("user") || "{}").id)
            setUserRole(user?.rol || null)
            console.log("User role:", user?.rol)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }
    fetchUserDetails()
  }, [])

  // Función para cerrar sesión: elimina el indicador de autenticación y redirige a "/login"
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await axios.post(
          `${API_BASE_URL}/api/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Error al hacer logout:", error);
    } finally {
      // Limpia todo rastro de token/usuario en el navegador
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Limpia el contador de fichas revisadas
      localStorage.removeItem(CONTEO_REVISADAS_KEY);
      // Redirige a la pantalla de login
      router.push("/login");
    }
  };

  //div mientras se obtiene le ususario 
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 to-gray-700">
        <Loader className="animate-spin h-12 w-12 text-asm-light-gold" />
        <span className="mt-4 text-2xl text-asm-light-gold font-semibold">Cargando...</span>
      </div>
    )
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
          className={`flex items-center px-4 py-2 mb-2 rounded-md ${pathname === "/" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
            } transition-colors duration-200`}
        >
          <Home size={18} className="mr-2" />
          <span>Inicio</span>
        </Link>

        <div className="px-4 py-2 text-xs font-medium text-asm-light-gold/70 uppercase tracking-wider">
          Módulos
        </div>


        {/* Prospectos y Asesores (expandible) */}
        <div className="mb-1">
          <button
            onClick={() => toggleSection("prospectos")}
            className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md transition-colors duration-200"
          >
            <div className="flex items-center">
              <Users size={18} className="mr-2" />
              <span>Prospectos y Asesores</span>
            </div>
            {expandedSections["prospectos"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {expandedSections["prospectos"] && (
            <div className="pl-6 text-sm space-y-1 mt-1 mb-2">
              {/* Links visibles para Administradores y Asesores */}
              <Link
                href="/gestion"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/gestion" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                  } transition-colors duration-200`}
              >
                <Users size={16} className="mr-2" />
                <span>Gestión de Prospectos</span>
              </Link>
              <Link
                href="/captura"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/captura" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                  } transition-colors duration-200`}
              >
                <Plus size={16} className="mr-2" />
                <span>Captura de Prospectos</span>
              </Link>
              <Link
                href="/leads-asignados"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/leads-asignados" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                  } transition-colors duration-200`}
              >
                <FileText size={16} className="mr-2" />
                <span>Leads Asignados</span>
              </Link>
              <Link
                href="/seguimiento"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/seguimiento" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                  } transition-colors duration-200`}
              >
                <ClipboardList size={16} className="mr-2" />
                <span>Panel de Seguimiento</span>
              </Link>
              <Link
                href="/importar-leads"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/importar-leads" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                  } transition-colors duration-200`}
              >
                <FileText size={16} className="mr-2" />
                <span>Importar Leads</span>
              </Link>

              {/* Activities ahora dentro de Prospectos y Asesores */}
              <div className="mt-2 mb-1 px-4 py-1 text-xs font-medium text-asm-light-gold/70">
                Activities
              </div>
              <Link
                href="/correos"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/correos" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                  } transition-colors duration-200`}
              >
                <Mail size={16} className="mr-2" />
                <span>Correos</span>
              </Link>
              <Link
                href="/calendario"
                className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/calendario" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                  } transition-colors duration-200`}
              >
                <Calendar size={16} className="mr-2" />
                <span>Calendario</span>
              </Link>

              {/* Aquí agregamos una condición para mostrar el Admin Panel solo para los administradores */}
              {userRole === "Administrador" && (
                <div className="mt-2 mb-1 px-4 py-1 text-xs font-medium text-asm-light-gold/70">
                  Admin Panel
                </div>
              )}

              {userRole === "Administrador" && (
                <Link
                  href="/admin"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/admin" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Users size={16} className="mr-2" />
                  <span>Panel de Administración</span>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Inscripción (expandible) */}
        {(userRole === "Administrador" || userRole === "Asesor") && (
          <div className="mb-1">
            <button
              onClick={() => toggleSection("inscripcion")}
              className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md transition-colors duration-200"
            >
              <div className="flex items-center">
                <FileText size={18} className="mr-2" />
                <span>Inscripción</span>
              </div>
              {expandedSections["inscripcion"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {expandedSections["inscripcion"] && (
              <div className="pl-6 text-sm space-y-1 mt-1 mb-2">
                <Link
                  href="/inscripcion/ficha"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/inscripcion/ficha"
                      ? "bg-asm-medium-gold text-white"
                      : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <FileText size={16} className="mr-2" />
                  <span>Ficha de Inscripción</span>
                </Link>
                <Link
                  href="/inscripcion/revision"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/inscripcion/revision"
                      ? "bg-asm-medium-gold text-white"
                      : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <FileText size={16} className="mr-2" />
                  <span>Revisión de Fichas</span>
                </Link>
                <Link
                  href="/firma"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/firma" || pathname.startsWith("/firma/")
                      ? "bg-asm-medium-gold text-white"
                      : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <FileSignature size={16} className="mr-2" />
                  <span>Firma Digital</span>
                </Link>

                <div className="mt-2 mb-1 px-4 py-1 text-xs font-medium text-asm-light-gold/70">
                  Documentos
                </div>
                <Link
                  href="/documentos"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/documentos"
                      ? "bg-asm-medium-gold text-white"
                      : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <FileText size={16} className="mr-2" />
                  <span>Validación de Documentos</span>
                </Link>

                <div className="mt-2 mb-1 px-4 py-1 text-xs font-medium text-asm-light-gold/70">
                  Administración
                </div>
                <Link
                  href="/inscripcion/admin/periodos"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/inscripcion/admin/periodos"
                      ? "bg-asm-medium-gold text-white"
                      : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Calendar size={16} className="mr-2" />
                  <span>Periodos de Inscripción</span>
                </Link>
                <Link
                  href="/inscripcion/admin/flujos"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/inscripcion/admin/flujos"
                      ? "bg-asm-medium-gold text-white"
                      : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Activity size={16} className="mr-2" />
                  <span>Flujos de Aprobación</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Académico (expandible) */}
        {userRole === "Administrador" && (
          <div className="mb-1">
            <button
              onClick={() => toggleSection("academico")}
              className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md transition-colors duration-200"
            >
              <div className="flex items-center">
                <BookOpen size={18} className="mr-2" />
                <span>Académico</span>
              </div>
              {expandedSections["academico"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {expandedSections["academico"] && (
              <div className="pl-6 text-sm space-y-1 mt-1 mb-2">
                <Link
                  href="/academico/programas"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/academico/programas" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <BookOpen size={16} className="mr-2" />
                  <span>Programas Académicos</span>
                </Link>
                <Link
                  href="/academico/usuarios"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/academico/usuarios" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Users size={16} className="mr-2" />
                  <span>Gestión de Estudiante</span>
                </Link>
                <Link
                  href="/academico/programacion"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/academico/programacion" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Calendar size={16} className="mr-2" />
                  <span>Programación de Cursos</span>
                </Link>
                <Link
                  href="/academico/asignacion"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/academico/asignacion" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <ClipboardList size={16} className="mr-2" />
                  <span>Asignación de Cursos</span>
                </Link>
                <Link
                  href="/academico/estatus-alumno"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/academico/estatus-alumno" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <UserCheck size={16} className="mr-2" />
                  <span>Estatus Académico</span>
                </Link>
                {/* <Link
                  href="/academico/estado-sistema"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/academico/estado-sistema" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Activity size={16} className="mr-2" />
                  <span>Estatus General</span>
                </Link> */}
                <Link
                  href="/academico/ranking"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/academico/ranking" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <BarChart2 size={16} className="mr-2" />
                  <span>Ranking Académico</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Docentes (expandible) */}
        {userRole === "Administrador" && (
          <div className="mb-1">
            <button
              onClick={() => toggleSection("docentes")}
              className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md transition-colors duration-200"
            >
              <div className="flex items-center">
                <GraduationCapIcon size={18} className="mr-2" />
                <span>Docentes</span>
              </div>
              {expandedSections["docentes"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {expandedSections["docentes"] && (
              <div className="pl-6 text-sm space-y-1 mt-1 mb-2">
                <Link
                  href="/docente"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/docente" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <LayoutDashboard size={16} className="mr-2" />
                  <span>Portal Docente</span>
                </Link>
                <Link
                  href="/docente/cursos"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/docente/cursos" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <BookOpen size={16} className="mr-2" />
                  <span>Mis Cursos</span>
                </Link>
                <Link
                  href="/docente/alumnos"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/docente/alumnos" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Users size={16} className="mr-2" />
                  <span>Alumnos</span>
                </Link>
                <Link
                  href="/docente/material"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/docente/material" || pathname === "/docente/material/nuevo"
                    ? "bg-asm-medium-gold text-white"
                    : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <FileText size={16} className="mr-2" />
                  <span>Material Didáctico</span>
                </Link>
                {/* Eliminada la opción de Evaluaciones */}
                <Link
                  href="/docente/mensajes"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/docente/mensajes" || pathname === "/docente/invitaciones"
                    ? "bg-asm-medium-gold text-white"
                    : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Mail size={16} className="mr-2" />
                  <span>Mensajería e Invitaciones</span>
                </Link>
                <Link
                  href="/docente/medallero"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/docente/medallero" || pathname === "/docente/insignias"
                    ? "bg-asm-medium-gold text-white"
                    : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Medal size={16} className="mr-2" />
                  <span>Medallero e Insignias</span>
                </Link>
                <Link
                  href="/docente/mi-aprendizaje"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/docente/mi-aprendizaje" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <BookOpen size={16} className="mr-2" />
                  <span>Mi Aprendizaje</span>
                </Link>
                <Link
                  href="/docente/calendario"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/docente/calendario" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Calendar size={16} className="mr-2" />
                  <span>Calendario</span>
                </Link>
                <Link
                  href="/docente/notificaciones"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/docente/notificaciones" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Bell size={16} className="mr-2" />
                  <span>Notificaciones</span>
                </Link>
                <Link
                  href="/docente/certificaciones"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/docente/certificaciones" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Award size={16} className="mr-2" />
                  <span>Certificaciones</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Estudiantes (expandible) */}
        {userRole === "Administrador" && (
          <div className="mb-1">
            <button
              onClick={() => toggleSection("estudiantes")}
              className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md transition-colors duration-200"
            >
              <div className="flex items-center">
                <Users size={18} className="mr-2" />
                <span>Estudiantes</span>
              </div>
              {expandedSections["estudiantes"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {expandedSections["estudiantes"] && (
              <div className="pl-6 text-sm space-y-1 mt-1 mb-2">
                <Link
                  href="/estudiantes"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/estudiantes" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <LayoutDashboard size={16} className="mr-2" />
                  <span>Dashboard Estudiantil</span>
                </Link>
                <Link
                  href="/estudiantes/documentos"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/estudiantes/documentos" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <FileText size={16} className="mr-2" />
                  <span>Documentos</span>
                </Link>
                <Link
                  href="/estudiantes/pagos"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/estudiantes/pagos" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <DollarSign size={16} className="mr-2" />
                  <span>Gestión de Pagos</span>
                </Link>
                <Link
                  href="/estudiantes/ranking"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/estudiantes/ranking" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Award size={16} className="mr-2" />
                  <span>Ranking Estudiantil</span>
                </Link>
                <Link
                  href="/estudiantes/calendario"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/estudiantes/calendario" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Calendar size={16} className="mr-2" />
                  <span>Calendario Académico</span>
                </Link>
                <Link
                  href="/estudiantes/notificaciones"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/estudiantes/notificaciones" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Bell size={16} className="mr-2" />
                  <span>Notificaciones</span>
                </Link>
                <Link
                  href="/estudiantes/perfil"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/estudiantes/perfil" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <UserCheck size={16} className="mr-2" />
                  <span>Mi Perfil</span>
                </Link>
                <Link
                  href="/estudiantes/estado-cuenta"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/estudiantes/estado-cuenta" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <CreditCard size={16} className="mr-2" />
                  <span>Estado de Cuenta</span>
                </Link>
                <Link
                  href="/estudiantes/chat-docente" // Cambiar la ruta a la correcta si es necesario
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/estudiantes/chat-docente" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Mail size={16} className="mr-2" /> {/* Puedes cambiar el ícono si lo consideras necesario */}
                  <span>Chat Docente</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Finanzas y Pagos (expandible) */}
        {userRole === "Administrador" && (
          <div className="mb-1">
            <button
              onClick={() => toggleSection("finanzas")}
              className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md transition-colors duration-200"
            >
              <div className="flex items-center">
                <DollarSign size={18} className="mr-2" />
                <span>Finanzas y Pagos</span>
              </div>
              {expandedSections["finanzas"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {expandedSections["finanzas"] && (
              <div className="pl-6 text-sm space-y-1 mt-1 mb-2">
                <Link
                  href="/finanzas/dashboard"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/finanzas/dashboard" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <PieChart size={16} className="mr-2" />
                  <span>Dashboard Financiero</span>
                </Link>
                <Link
                  href="/finanzas/estado-cuenta"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/finanzas/estado-cuenta" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <FileText size={16} className="mr-2" />
                  <span>Estado de Cuenta</span>
                </Link>
                <Link
                  href="/finanzas/gestion-pagos"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/finanzas/gestion-pagos" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <CreditCard size={16} className="mr-2" />
                  <span>Gestión de Pagos</span>
                </Link>
                <Link
                  href="/finanzas/conciliacion"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/finanzas/conciliacion" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <RefreshCw size={16} className="mr-2" />
                  <span>Conciliación Bancaria</span>
                </Link>
                <Link
                  href="/finanzas/seguimiento-cobros"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/finanzas/seguimiento-cobros" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Phone size={16} className="mr-2" />
                  <span>Seguimiento de Cobros</span>
                </Link>
                <Link
                  href="/finanzas/reportes"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/finanzas/reportes" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <BarChart size={16} className="mr-2" />
                  <span>Reportes Financieros</span>
                </Link>
                <Link
                  href="/finanzas/configuracion"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/finanzas/configuracion" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Settings size={16} className="mr-2" />
                  <span>Configuración</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Administración (expandible) */}
        {userRole === "Administrador" && (
          <div className="mb-1">
            <button
              onClick={() => toggleSection("administracion")}
              className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md transition-colors duration-200"
            >
              <div className="flex items-center">
                <Settings size={18} className="mr-2" />
                <span>Administración</span>
              </div>
              {expandedSections["administracion"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {expandedSections["administracion"] && (
              <div className="pl-6 text-sm space-y-1 mt-1 mb-2">
                <Link
                  href="/admin/dashboard"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/admin/dashboard" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <LayoutDashboard size={16} className="mr-2" />
                  <span>Dashboard Administrativo</span>
                </Link>
                <Link
                  href="/admin/programacion-cursos"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/admin/programacion-cursos" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Calendar size={16} className="mr-2" />
                  <span>Programación de Cursos</span>
                </Link>
                <Link
                  href="/admin/reportes-matricula"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/admin/reportes-matricula" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <FileCheck size={16} className="mr-2" />
                  <span>Reportes de Matrícula</span>
                </Link>
                <Link
                  href="/admin/reporte-graduaciones"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/admin/reporte-graduaciones" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <GraduationCapIcon size={16} className="mr-2" />
                  <span>Reporte de Graduaciones</span>
                </Link>
                <Link
                  href="/admin/plantillas-mailing"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/admin/plantillas-mailing" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Send size={16} className="mr-2" />
                  <span>Plantillas y Mailing</span>
                </Link>
                <Link
                  href="/admin/configuracion"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/admin/configuracion" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Settings size={16} className="mr-2" />
                  <span>Configuración General</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Seguridad (expandible) */}
        {userRole === "Administrador" && (
          <div className="mb-1">
            <button
              onClick={() => toggleSection("seguridad")}
              className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md transition-colors duration-200"
            >
              <div className="flex items-center">
                <Shield size={18} className="mr-2" />
                <span>Seguridad</span>
              </div>
              {expandedSections["seguridad"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {expandedSections["seguridad"] && (
              <div className="pl-6 text-sm space-y-1 mt-1 mb-2">
                {/* Dashboard Seguridad */}
                <Link
                  href="/seguridad/dashboard"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/seguridad/dashboard" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <LayoutDashboard size={16} className="mr-2" />
                  <span>Dashboard Seguridad</span>
                </Link>

                {/* 2FA */}
                <Link
                  href="/seguridad/2fa"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/seguridad/2fa" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Key size={16} className="mr-2" />
                  <span>Autenticación 2FA</span>
                </Link>

                {/* Accesos */}
                <Link
                  href="/seguridad/accesos"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/seguridad/accesos" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <LogIn size={16} className="mr-2" />
                  <span>Accesos</span>
                </Link>

                {/* Auditoría */}
                <Link
                  href="/seguridad/auditoria"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/seguridad/auditoria" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Activity size={16} className="mr-2" />
                  <span>Auditoría</span>
                </Link>

                {/* Políticas */}
                <Link
                  href="/seguridad/politicas"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/seguridad/politicas" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <FileText size={16} className="mr-2" />
                  <span>Políticas</span>
                </Link>

                {/* Respaldo */}
                {/* <Link
                        href="/seguridad/respaldos"
                        className={`flex items-center px-4 py-1.5 rounded-md ${
                          pathname === "/seguridad/respaldo" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                        } transition-colors duration-200`}
                      >
                        <Database size={16} className="mr-2" />
                        <span>Respaldo</span>
                      </Link> */}

                {/* Roles */}
                <Link
                  href="/seguridad/roles"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/seguridad/roles" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Users size={16} className="mr-2" />
                  <span>Roles</span>
                </Link>

                {/* Sesiones */}
                <Link
                  href="/seguridad/sesiones"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/seguridad/sesiones" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Clock size={16} className="mr-2" />
                  <span>Sesiones</span>
                </Link>

                {/* Usuarios */}
                <Link
                  href="/seguridad/usuarios"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/seguridad/usuarios" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <UserCheck size={16} className="mr-2" />
                  <span>Usuarios</span>
                </Link>
                {/* Permisos */}
                <Link
                  href="/seguridad/permisos"
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === "/seguridad/permisos" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                    } transition-colors duration-200`}
                >
                  <Shield size={16} className="mr-2" />
                  <span>Permisos</span>
                </Link>
              </div>
            )}
          </div>

        )}

      </div>

      <div className="mt-auto p-4 border-t border-asm-medium-gold/30">
        {/* Botón de Cerrar Sesión */}
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
