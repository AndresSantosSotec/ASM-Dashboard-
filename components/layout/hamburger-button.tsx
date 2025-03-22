"use client"

import { cn } from "@/lib/utils"

interface HamburgerButtonProps {
  isOpen: boolean
  onClick: () => void
  className?: string
}

export default function HamburgerButton({ isOpen, onClick, className }: HamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn("hamburger-btn focus:outline-none", className)}
      aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
    >
      <div className={`hamburger-icon ${isOpen ? "active" : ""}`}>
        <span></span>
      </div>
    </button>
  )
}

