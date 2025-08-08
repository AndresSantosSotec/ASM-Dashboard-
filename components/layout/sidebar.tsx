"use client";


import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { AllowedView } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { api } from "@/services/api";

interface SidebarProps {
  open?: boolean;
  className?: string;
}

export default function Sidebar({ open, className }: SidebarProps) {
  const { allowedViews, setToken, setAllowedViews } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const uniqueViews = useMemo(() => {
    const map = new Map<string, AllowedView>();
    allowedViews.forEach((view) => {
      if (!map.has(view.view_path)) {
        map.set(view.view_path, view);
      }
    });
    return Array.from(map.values());
  }, [allowedViews]);

  const modules = useMemo(() => {
    const grouped: Record<string, AllowedView[]> = {};
    uniqueViews.forEach((view) => {

      const key = view.module?.name || "General";
      grouped[key] = grouped[key] || [];
      grouped[key].push(view);
    });
    return grouped;

  }, [uniqueViews]);

  const moduleOrder = [
    "Académico",
    "Prospectos y Asesores",
    "Inscripción",
    "Docentes",
    "Estudiantes",
    "Finanzas y Pagos",
    "Administración",
    "Seguridad",
  ];

  const sortedModuleNames = useMemo(() => {
    return Object.keys(modules).sort((a, b) => {
      const indexA = moduleOrder.indexOf(a);
      const indexB = moduleOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [modules]);

  const toggleModule = (module: string) => {
    setExpanded((prev) => ({ ...prev, [module]: !prev[module] }));
  };


  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (e) {
      // ignore
    } finally {
      setToken(null);
      setAllowedViews([]);
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  return (
    <div
      className={`${open ? "w-64" : "w-0 -translate-x-full"} transition-all duration-300 asm-gradient border-r border-asm-medium-gold/30 flex flex-col h-full overflow-y-auto ${cn("pb-12", className)}`}
    >
      <div className="p-4 border-b border-asm-medium-gold/30">
        <Link href="/" className="flex items-center text-asm-light-gold font-semibold text-lg">
          <span>American School of Management</span>
        </Link>
      </div>
      <div className="flex-1 py-4 overflow-y-auto px-3">
        <Link
          href="/"
          className={`flex items-center px-4 py-2 mb-2 rounded-md ${pathname === "/" ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"} transition-colors duration-200`}
        >
          <Icons.Home size={18} className="mr-2" />
          <span>Inicio</span>
        </Link>

        <div className="px-4 py-2 text-xs font-medium text-asm-light-gold/70 uppercase tracking-wider">
          Módulos
        </div>

        {sortedModuleNames.map((moduleName) => {
          const views = modules[moduleName];
          const isOpen = expanded[moduleName];
          return (
            <div key={moduleName} className="mb-1">
              <button
                onClick={() => toggleModule(moduleName)}
                className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md transition-colors duration-200"
              >
                <span>{moduleName}</span>
                {isOpen ? <Icons.ChevronDown size={16} /> : <Icons.ChevronRight size={16} />}
              </button>

              {isOpen && (
                <div className="pl-6 text-sm space-y-1 mt-1 mb-2">
                  {views.map((view) => {
                    const Icon = (Icons as any)[view.icon] || Icons.File;
                    return (
                      <Link
                        key={view.view_path}
                        href={view.view_path}
                        className={`flex items-center px-4 py-1.5 rounded-md ${pathname === view.view_path ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"} transition-colors duration-200`}
                      >
                        <Icon size={16} className="mr-2" />
                        <span>{view.menu}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-auto p-4 border-t border-asm-medium-gold/30">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 rounded-md text-red-400 hover:bg-red-500/10 transition-colors duration-200"
        >
          <Icons.LogOut size={18} className="mr-2" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
