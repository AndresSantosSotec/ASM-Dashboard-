"use client"

import type React from "react"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function InscripcionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="container mx-auto max-w-6xl p-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-900">Ficha de Inscripción</h1>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
}

