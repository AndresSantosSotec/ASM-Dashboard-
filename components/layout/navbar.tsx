"use client"

import { Bell, Menu, Search, User } from "lucide-react"
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

interface NavbarProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export default function Navbar({ onToggleSidebar, sidebarOpen }: NavbarProps) {
  const isMobile = useMobile()

  return (
    <div className="h-16 border-b border-asm-medium-gold/20 bg-white dark:bg-asm-dark-navy flex items-center px-4 sticky top-0 z-30">
      <div className="flex items-center gap-4 w-full">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="text-asm-navy dark:text-asm-light-gold hover:bg-asm-light-gold/10 hover:text-asm-navy dark:hover:bg-asm-medium-gold/20 dark:hover:text-asm-light-gold"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {!isMobile && (
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-asm-navy/50 dark:text-asm-light-gold/50" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-full pl-9 bg-gray-50 border-asm-medium-gold/20 focus-visible:ring-asm-medium-gold dark:bg-asm-navy/20 dark:border-asm-medium-gold/30 dark:placeholder:text-asm-light-gold/50"
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-asm-navy dark:text-asm-light-gold hover:bg-asm-light-gold/10 hover:text-asm-navy dark:hover:bg-asm-medium-gold/20 dark:hover:text-asm-light-gold"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 border border-asm-medium-gold/30"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                  <AvatarFallback className="bg-asm-navy text-asm-light-gold text-xs">ASM</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>Configuración</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Cerrar Sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

