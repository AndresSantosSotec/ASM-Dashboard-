"use client"

import { useEffect } from "react"
import "@/styles/globals.css"

export default function FirmarContratoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Forzar tema claro: quitar clase "dark" del <html> y restaurarla al salir
  useEffect(() => {
    const html = document.documentElement
    const wasDark = html.classList.contains("dark")
    // Remover dark mode
    html.classList.remove("dark")
    html.style.colorScheme = "light"
    // Forzar scroll en body
    document.body.style.overflow = "auto"
    document.body.style.height = "auto"
    html.style.overflow = "auto"
    html.style.height = "auto"

    return () => {
      // Restaurar si estaba en dark mode al salir
      if (wasDark) {
        html.classList.add("dark")
        html.style.colorScheme = ""
      }
      document.body.style.overflow = ""
      document.body.style.height = ""
      html.style.overflow = ""
      html.style.height = ""
    }
  }, [])

  // Observar cambios para evitar que next-themes re-aplique dark
  useEffect(() => {
    const html = document.documentElement
    const observer = new MutationObserver(() => {
      if (html.classList.contains("dark")) {
        html.classList.remove("dark")
      }
    })
    observer.observe(html, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className="font-sans min-h-screen bg-slate-50 text-slate-900"
      style={{ colorScheme: "light" }}
    >
      {children}
    </div>
  )
}
