"use client"

import React, { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Sidebar from "@/components/layout/sidebar"
import ProtectedRoute from "@/components/ProtectedRoute"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import NotificationBell from "@/components/layout/NotificationBell"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [userName, setUserName] = useState<string>("")

  // Verificar autenticación y obtener el nombre del usuario
  useEffect(() => {
    const token = localStorage.getItem("token")
    const isPublicRoute = pathname === "/login" || pathname?.startsWith("/firmar-contrato")

    if (!token && !isPublicRoute) {
      router.push("/login")
    } else {
      const storedUserName = localStorage.getItem("username")
      setUserName(storedUserName || "")
    }
  }, [pathname, router])

  // Detectar si el dispositivo es móvil y ajustar la visibilidad del sidebar
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      // En móvil empieza cerrado, en desktop abierto
      setSidebarOpen(!mobile)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const handleOverlayClick = () => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  return (
    <>
      {pathname === "/login" || pathname?.startsWith("/firmar-contrato") ? (
        <main>
          {children}
          <Toaster />
        </main>
      ) : (
        <div className="flex h-screen overflow-hidden bg-gray-50/80 dark:bg-[#0c1220]">
          {/* Mobile overlay with blur */}
          {isMobile && sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 animate-fadeIn lg:hidden"
              onClick={handleOverlayClick}
              aria-hidden="true"
            />
          )}

          {/* Sidebar container */}
          <div
            className={cn(
              "z-30 h-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
              isMobile ? "fixed inset-y-0 left-0 w-[280px]" : "relative", // Mobile: fixed drawer
              isMobile
                ? (sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full") // Mobile toggle
                : (sidebarOpen ? "w-64" : "w-[80px]") // Desktop toggle: expanded vs collapsed
            )}
          >
            <Sidebar open={sidebarOpen} isMobile={isMobile} />
          </div>

          {/* Main content area */}
          <div className="flex flex-col flex-1 w-full overflow-hidden transition-all duration-300">
            {/* ─── Premium Header ─── */}
            <header className="h-16 flex items-center px-5 header-glass sticky top-0 z-20">
              {/* Left: Toggle + Welcome */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={cn(
                    "p-2 rounded-xl transition-all duration-200 group",
                    "text-asm-navy dark:text-asm-light-gold",
                    "hover:bg-asm-navy/[0.06] dark:hover:bg-white/[0.06]",
                    "active:scale-95"
                  )}
                  aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
                >
                  {isMobile && sidebarOpen ? (
                    <X size={20} className="transition-transform duration-200" />
                  ) : (
                    // Si está colapsado (desktop), mostramos icono normal. 
                    // Podemos rotarlo si queremos indicar expansión.
                    <Menu size={20} className={cn("transition-transform duration-300", sidebarOpen && !isMobile && "rotate-0")} />
                  )}
                </button>

                {!isMobile && (
                  <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                    <h1 className="text-sm font-semibold text-asm-navy dark:text-asm-light-gold leading-tight">
                      {userName ? `Bienvenido, ${userName}` : "American School of Management"}
                    </h1>
                    <p className="text-[11px] text-asm-navy/50 dark:text-asm-light-gold/40 leading-tight">
                      Panel de Gestión
                    </p>
                  </div>
                )}
              </div>

              {/* Right: Actions */}
              <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
                <NotificationBell />
              </div>
            </header>

            {/* ─── Page Content ─── */}
            <main
              className="flex-1 overflow-auto w-full p-4 md:p-6 page-enter"
            >
              <ProtectedRoute>
                {children}
              </ProtectedRoute>
            </main>
          </div>

          <Toaster />
        </div>
      )}
    </>
  )
}