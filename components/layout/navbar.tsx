"use client"

import { Menu, Search, User, LogOut, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useMobile } from "@/hooks/use-mobile"
import NotificationBell from "@/components/layout/NotificationBell"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect, useState } from "react"

interface NavbarProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export default function Navbar({ onToggleSidebar, sidebarOpen }: NavbarProps) {
  const isMobile = useMobile()
  const router = useRouter()
  const { setToken } = useAuth()
  const [userName, setUserName] = useState("ASM")
  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        const user = JSON.parse(storedUser)
        const initials = [user.first_name, user.last_name]
          .filter(Boolean)
          .map((n: string) => n.charAt(0).toUpperCase())
          .join("")
        setUserName(initials || user.username?.charAt(0)?.toUpperCase() || "U")
        setUserRole(user.rol || "")
      }
    } catch (e) {
      // ignore
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("userId")
    localStorage.removeItem("allowedViews")
    localStorage.removeItem("permissions")
    setToken(null)
    router.push("/login")
  }

  // Los estudiantes van a /estudiantes/perfil, los demás a /mi-perfil
  const isEstudiante = userRole.toLowerCase() === "estudiante"
  const profileRoute = isEstudiante ? "/estudiantes/perfil" : "/mi-perfil"

  return (
    <div className="h-16 border-b border-gaia-wine/20 bg-white dark:bg-gaia-navy-dark flex items-center px-4 sticky top-0 z-30">
      <div className="flex items-center gap-4 w-full">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="text-gaia-navy dark:text-gaia-light hover:bg-gaia-light/10 hover:text-gaia-navy dark:hover:bg-gaia-wine/20 dark:hover:text-gaia-light"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {!isMobile && (
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gaia-navy/50 dark:text-gaia-light/50" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-full pl-9 bg-gray-50 border-gaia-wine/20 focus-visible:ring-gaia-wine dark:bg-gaia-navy/20 dark:border-gaia-wine/30 dark:placeholder:text-gaia-light/50"
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-4">
          <NotificationBell />


          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 border border-gaia-wine/30"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                  <AvatarFallback className="bg-gaia-navy text-gaia-light text-xs">{userName}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(profileRoute)} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>
              {!isEstudiante && (
                <DropdownMenuItem onClick={() => router.push("/mi-perfil?tab=security")} className="cursor-pointer">
                  <KeyRound className="mr-2 h-4 w-4" />
                  <span>Cambiar Contraseña</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

