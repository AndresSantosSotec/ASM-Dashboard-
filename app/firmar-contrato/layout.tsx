"use client"

import type { Metadata } from "next"
import "@/styles/globals.css"

export default function FirmarContratoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Layout completamente independiente sin MainLayout, sidebar, ni componentes del sistema
  return (
    <div className="font-sans min-h-screen">
      {children}
    </div>
  )
}
