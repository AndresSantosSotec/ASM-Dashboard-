"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Sidebar from "@/components/layout/sidebar" // Puedes cambiar a ResponsiveSidebar si lo prefieres
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  // Eliminamos la verificación de "isAuthenticated" y en su lugar verificamos si hay token
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const token = localStorage.getItem("token")

    // Si no existe token y no estás en "/login", redirige
    if (!token && pathname !== "/login") {
      router.push("/login")
    } else {
      // Si hay token o estás en "/login", asumimos que no forzamos la redirección
      setIsAuthenticated(!!token)
    }
  }, [pathname, router])

  // Detectar si el dispositivo es móvil y ajustar la visibilidad del sidebar
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      setSidebarOpen(!mobile) // En móvil se cierra, en desktop se abre
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  // Función para cerrar el sidebar al hacer clic en el overlay en móvil
  const handleOverlayClick = () => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  return (
    <>
      {pathname === "/login" ? (
        // Si estamos en la página de login, mostramos sólo el contenido principal y el Toaster
        <main>
          {children}
          <Toaster />
        </main>
      ) : (
        // De lo contrario, renderizamos el layout completo
        <div className="flex h-screen overflow-hidden bg-gray-50">
          {/* Overlay para móvil cuando el sidebar está abierto */}
          {isMobile && sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-20 animate-fadeIn lg:hidden"
              onClick={handleOverlayClick}
              aria-hidden="true"
            />
          )}

          {/* Sidebar con animación */}
          <div
            className={cn(
              "fixed lg:relative z-30 h-full transition-all duration-300 ease-in-out",
              sidebarOpen ? "translate-x-0" : "-translate-x-full",
              isMobile ? "w-[280px]" : "w-64"
            )}
          >
            <Sidebar open={sidebarOpen} />
          </div>

          {/* Contenido principal */}
          <div className="flex flex-col flex-1 w-full overflow-hidden">
            {/* Header con botón de hamburguesa */}
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
                  American School of Management
                </h1>

                <div className="flex items-center space-x-2">
                  {/* Aquí puedes añadir elementos de la barra superior, como notificaciones o perfil */}
                </div>
              </div>
            </header>

            {/* Área de contenido con padding */}
            <main
              className={cn(
                "flex-1 overflow-y-auto transition-all duration-300 ease-in-out",
                isMobile ? "w-full" : "lg:ml-0"
              )}
            >
              <div className="p-4 md:p-6">{children}</div>
            </main>
          </div>

          {/* Toaster para notificaciones */}
          <Toaster />
        </div>
      )}
    </>
  )
}
