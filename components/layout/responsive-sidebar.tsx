"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/layout/sidebar"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ResponsiveSidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)

      // En móviles, cerrar el sidebar por defecto
      if (mobile) {
        setIsOpen(false)
      } else {
        setIsOpen(true)
      }
    }

    // Comprobar al cargar
    checkIfMobile()

    // Comprobar al cambiar el tamaño de la ventana
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  return (
    <>
      {/* Botón de hamburguesa para móviles */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 bg-white dark:bg-asm-navy shadow-md"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Menu className="h-5 w-5 text-asm-navy dark:text-asm-light-gold" />
        </Button>
      )}

      {/* Overlay para cerrar el sidebar en móviles */}
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setIsOpen(false)} aria-hidden="true" />
      )}

      {/* Sidebar con animación */}
      <div
        className={`
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          ${isMobile ? "fixed" : "relative"} 
          z-30 transition-transform duration-300 ease-in-out
        `}
      >
        <Sidebar open={true} />
      </div>
    </>
  )
}

