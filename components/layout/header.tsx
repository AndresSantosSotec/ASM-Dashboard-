"use client"

import { Menu, Bell, User, Search } from "lucide-react"
import { useEffect, useState } from "react"

interface HeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  isMobile: boolean
}

export default function Header({ sidebarOpen, setSidebarOpen, isMobile }: HeaderProps) {
  const [userName, setUserName] = useState("")

  useEffect(() => {
    const storedUserName = localStorage.getItem("username")
    setUserName(storedUserName || "")
  }, [])

  return (
    <header className="sticky top-0 z-10 h-16 flex items-center justify-between px-4 bg-card dark:bg-gaia-navy border-b border-gaia-wine/20 shadow-sm">
      <div className="flex items-center">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md text-gaia-navy dark:text-gaia-light hover:bg-gaia-light/10 transition-colors"
          aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
        >
          <Menu size={24} />
        </button>

        {!isMobile && (
          <h1 className="ml-4 text-lg font-semibold text-gaia-navy dark:text-gaia-light">
            {userName ? `Bienvenido, ${userName}` : "Gaia Business School"}
          </h1>
        )}
      </div>

      <div className="hidden md:flex items-center relative max-w-md w-full mx-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full pl-10 pr-4 py-2 rounded-md border border-gaia-wine/30 focus:outline-none focus:ring-2 focus:ring-gaia-wine/50 bg-background dark:bg-gaia-navy/50 text-foreground dark:text-gaia-light"
        />
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full text-gaia-navy dark:text-gaia-light hover:bg-gaia-light/10 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gaia-wine flex items-center justify-center text-white">
            <User size={18} />
          </div>
          <span className="hidden md:inline text-sm font-medium text-gaia-navy dark:text-gaia-light">
            {userName ? userName : "Admin"}
          </span>
        </div>
      </div>
    </header>
  )
}