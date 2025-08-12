"use client"

import React, { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Sidebar from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { PermissionsProvider, usePermissions } from "@/permissions/PermissionsProvider"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userName, setUserName] = useState<string>("")
  const [ids, setIds] = useState<{ userId: number; roleId: number } | null>(null)

  // Verificar autenticación y obtener el nombre del usuario
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token && pathname !== "/login") {
      router.push("/login")
    } else {
      setIsAuthenticated(!!token)
      // Supongamos que el username está almacenado en localStorage
      const storedUserName = localStorage.getItem("username")
      setUserName(storedUserName || "")
    }
  }, [pathname, router])

  // Detectar si el dispositivo es móvil y ajustar la visibilidad del sidebar
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  useEffect(() => {
    const uid = Number(localStorage.getItem("userId"))
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const rid = user.role_id ?? user.roleId
    if (uid && rid) {
      setIds({ userId: uid, roleId: rid })
    }
  }, [])

  const handleOverlayClick = () => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  return (
    <>
      {pathname === "/login" ? (
        <main>
          {children}
          <Toaster />
        </main>
      ) : (
        <div className="flex h-screen overflow-hidden bg-gray-50">
          {isMobile && sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-20 animate-fadeIn lg:hidden"
              onClick={handleOverlayClick}
              aria-hidden="true"
            />
          )}

          <div
            className={cn(
              "fixed lg:relative z-30 h-full transition-all duration-300 ease-in-out",
              sidebarOpen ? "translate-x-0" : "-translate-x-full",
              isMobile ? "w-[280px]" : "w-64"
            )}
          >
            <Sidebar open={sidebarOpen} />
          </div>

          <div className="flex flex-col flex-1 w-full overflow-hidden">
            <header className="h-16 flex items-center px-4 border-b border-asm-medium-gold/20 bg-white dark:bg-asm-navy">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-asm-navy dark:text-asm-light-gold hover:bg-asm-light-gold/10 transition-colors mr-4"
                aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
              >
                {sidebarOpen && isMobile ? <X size={24} /> : <Menu size={24} />}
              </button>

              <div className="flex-1 flex justify-between items-center">
                <h1 className="text-lg font-semibold text-asm-navy dark:text-asm-light-gold">
                  {userName ? `Bienvenido, ${userName}` : "American School of Management"}
                </h1>

                <div className="flex items-center space-x-2">
                  {/* Aquí puedes añadir otros elementos de la barra superior */}
                </div>
              </div>
            </header>

            <main
              className={cn(
                "flex-1 overflow-y-auto transition-all duration-300 ease-in-out",
                isMobile ? "w-full" : "lg:ml-0"
              )}
            >
              {ids && (
                <PermissionsProvider userId={ids.userId} roleId={ids.roleId}>
                  <PermissionsGate>
                    <div className="p-4 md:p-6">{children}</div>
                  </PermissionsGate>
                </PermissionsProvider>
              )}
            </main>
          </div>

          <Toaster />
        </div>
      )}
    </>
  )
}

function PermissionsGate({ children }: { children: React.ReactNode }) {
  const { loading, error, refresh } = usePermissions()
  if (loading) return <div className="p-4">Cargando permisos...</div>
  if (error)
    return (
      <div className="p-4">
        Error al cargar permisos. <button onClick={refresh}>Reintentar</button>
      </div>
    )
  return <>{children}</>
}
