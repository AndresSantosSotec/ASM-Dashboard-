"use client"

import type { ReactNode } from "react"
import Sidebar from "@/components/sidebar"

interface DocenteLayoutProps {
  children: ReactNode
}

export default function DocenteLayout({ children }: DocenteLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={true} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}

