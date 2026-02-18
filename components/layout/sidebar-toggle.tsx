"use client"

import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarToggleProps {
  isOpen: boolean
  onClick: () => void
  className?: string
}

export default function SidebarToggle({ isOpen, onClick, className }: SidebarToggleProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-2 rounded-md transition-colors duration-200",
        "text-gaia-navy dark:text-gaia-light",
        "hover:bg-gaia-light/10 dark:hover:bg-gaia-wine/20",
        "focus:outline-none focus:ring-2 focus:ring-gaia-wine/50",
        className,
      )}
      aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  )
}

