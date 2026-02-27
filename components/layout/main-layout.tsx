"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import NotificationBell from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isOpen, isMobile, toggle, sidebarWidth } = useSidebar();

  const userDisplayName =
    typeof window !== "undefined"
      ? localStorage.getItem("username") || user?.name || ""
      : user?.name || "";

  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-[#0c1220]">
      {/* Overlay en mobile/tablet cuando el sidebar está abierto */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggle}
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* Sidebar a la izquierda: se renderiza primero */}
      <Sidebar />

      {/* Contenido principal: marginLeft dinámico para que NUNCA quede tapado por el sidebar */}
      <motion.div
        className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden"
        animate={{
          marginLeft: isMobile ? 0 : isOpen ? sidebarWidth : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Topbar: ancho completo del área de contenido (no necesita offset) */}
        <header className="sticky top-0 z-20 flex h-16 w-full items-center border-b border-gray-100 bg-white/90 px-4 shadow-sm backdrop-blur-md dark:bg-[#0c1220]/90 dark:border-white/5 md:px-6">
          <div className="flex w-full items-center gap-3">
            {!isMobile && (
              <div className="flex flex-col">
                <h1 className="text-sm font-semibold leading-tight text-gaia-navy dark:text-gaia-light">
                  {userDisplayName
                    ? `Bienvenido, ${userDisplayName}`
                    : "Gaia"}
                </h1>
                <p className="text-[11px] leading-tight text-gaia-navy/50 dark:text-gaia-light/40">
                  Panel de Gestión
                </p>
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />
              <HamburgerButton />
            </div>
          </div>
        </header>

        {/* Área de contenido con padding para no quedar bajo el header */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="h-16 shrink-0" />
          <ProtectedRoute>{children}</ProtectedRoute>
        </main>
      </motion.div>

      <Toaster />
    </div>
  );
}

function HamburgerButton() {
  const { isOpen, toggle } = useSidebar();

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={toggle}
      className={cn(
        "p-2 rounded-xl transition-colors",
        "text-gaia-navy dark:text-gaia-light",
        "hover:bg-gaia-navy/[0.06] dark:hover:bg-white/[0.06]"
      )}
      aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.span
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="inline-flex"
          >
            <X className="h-5 w-5" />
          </motion.span>
        ) : (
          <motion.span
            key="menu"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="inline-flex"
          >
            <Menu className="h-5 w-5" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    const isPublicRoute =
      pathname === "/login" || pathname?.startsWith("/firmar-contrato");

    if (!token && !isPublicRoute) {
      router.push("/login");
    }
  }, [pathname, router]);

  if (pathname === "/login" || pathname?.startsWith("/firmar-contrato")) {
    return (
      <main>
        {children}
        <Toaster />
      </main>
    );
  }

  return (
    <SidebarProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
}
