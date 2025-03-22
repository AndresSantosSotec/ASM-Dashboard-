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
        "text-asm-navy dark:text-asm-light-gold",
        "hover:bg-asm-light-gold/10 dark:hover:bg-asm-medium-gold/20",
        "focus:outline-none focus:ring-2 focus:ring-asm-medium-gold/50",
        className,
      )}
      aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  )
}

