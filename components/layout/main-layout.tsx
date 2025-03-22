"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import Sidebar from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024 && sidebarOpen) {
        setSidebarOpen(false)
      } else if (window.innerWidth >= 1024 && !sidebarOpen) {
        setSidebarOpen(true)
      }
    }

    // Comprobar al cargar
    checkIfMobile()

    // Comprobar al cambiar el tamaño de la ventana
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [sidebarOpen])

  // Cerrar sidebar al hacer clic en el overlay en móvil
  const handleOverlayClick = () => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
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
          isMobile ? "w-[280px]" : "w-64",
        )}
      >
        <Sidebar open={true} />
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
              {/* Aquí puedes añadir elementos de la barra superior como notificaciones, perfil, etc. */}
            </div>
          </div>
        </header>

        {/* Contenido principal con padding */}
        <main
          className={cn(
            "flex-1 overflow-y-auto transition-all duration-300 ease-in-out",
            isMobile ? "w-full" : sidebarOpen ? "lg:ml-0" : "lg:ml-0",
          )}
        >
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

