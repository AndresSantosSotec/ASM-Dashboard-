import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Portal Docente | Blue Atlas",
  description: "Portal centralizado para docentes",
}

export default function DocenteLayout({ children }: { children: ReactNode }) {
  // Simplemente pasamos los children sin agregar ninguna estructura adicional
  return <>{children}</>
}

