"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface HeaderProps {
  title: string
  showBackButton?: boolean
}

export function Header({ title, showBackButton = true }: HeaderProps) {
  const router = useRouter()

  return (
    <div className="border-b bg-background">
      <div className="flex h-16 items-center px-4 md:px-6">
        {showBackButton && (
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Volver</span>
          </Button>
        )}
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
    </div>
  )
}

