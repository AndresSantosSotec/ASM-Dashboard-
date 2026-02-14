
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { AllowedView } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { api } from "@/services/api";

/** --- Tipos locales para metadatos del módulo --- */
type LucideIconName = keyof typeof Icons;

type ModuleMeta = {
  /** Nombre exacto como viene en allowedViews.module.name */
  name: string;
  /** Orden fijo global */
  order: number;
  /** Icono de módulo (lucide) si no hay logo */
  icon?: LucideIconName;
  /** Logo estático del módulo (si tienes assets para cada módulo) */
  logoSrc?: string;
};

/** --- Orden fijo de módulos y metadatos (fallbacks) --- */
const MODULES_META: ModuleMeta[] = [
  // Orden definido por producto: Prospectos y Asesores primero
  { name: "Prospectos y Asesores", order: 1, icon: "Users" },
  { name: "Inscripción",           order: 2, icon: "FileText" },
  { name: "Académico",             order: 3, icon: "BookOpen" },
  { name: "Finanzas y Pagos",      order: 4, icon: "DollarSign" },
  { name: "Docentes",              order: 5, icon: "GraduationCap" as LucideIconName },
  { name: "Estudiantes",           order: 6, icon: "Users" },
  { name: "Seguridad",             order: 7, icon: "Shield" },
  { name: "Administración",        order: 8, icon: "Settings" },
];

/** Mapa rápido: nombre → meta */
const MODULE_META_MAP: Record<string, ModuleMeta> = Object.fromEntries(
  MODULES_META.map((m) => [m.name, m])
);

/** Ícono por defecto para módulos/vistas cuando no existe el solicitado */
const DEFAULT_MODULE_ICON: LucideIconName = "Folder";
const DEFAULT_VIEW_ICON: LucideIconName = "File";

/** Si el backend empieza a mandar logos, puedes leer view.module.logo o view.module.icon */
export default function Sidebar({ open, className }: { open?: boolean; className?: string }) {
  const { allowedViews, setToken, setAllowedViews } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  /** 1) Unificar por view_path para evitar duplicados */
  const uniqueViews = useMemo(() => {
    const map = new Map<string, AllowedView>();
    for (const v of allowedViews) {
      if (!map.has(v.view_path)) map.set(v.view_path, v);
    }
    return Array.from(map.values());
  }, [allowedViews]);

  /** 2) Agrupar por módulo */
  const modules = useMemo(() => {
    const grouped: Record<string, AllowedView[]> = {};
    for (const view of uniqueViews) {
      const key = view.module?.name ?? "General";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(view);
    }
    return grouped;
  }, [uniqueViews]);

  /** 3) Ordenar módulos: fijo primero por MODULES_META, desconocidos al final alfabéticos */
  const sortedModuleNames = useMemo(() => {
    const names = Object.keys(modules);
    return names.sort((a, b) => {
      const ma = MODULE_META_MAP[a];
      const mb = MODULE_META_MAP[b];
      if (ma && mb) return ma.order - mb.order;        // ambos conocidos
      if (ma && !mb) return -1;                        // a conocido, b desconocido
      if (!ma && mb) return 1;                         // b conocido, a desconocido
      return a.localeCompare(b);                       // ambos desconocidos → ABC
    });
  }, [modules]);

  /** 4) Ordenar vistas dentro del módulo por order_index si existe, si no por nombre */
  function sortViews(views: AllowedView[]) {
    return [...views].sort((a, b) => {
      const ao = (a as any).order_index ?? 9999;
      const bo = (b as any).order_index ?? 9999;
      if (ao !== bo) return ao - bo;
      return a.menu.localeCompare(b.menu);
    });
  }

  const toggleModule = (module: string) =>
    setExpanded((prev) => ({ ...prev, [module]: !prev[module] }));

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch {
      /* ignore */
    } finally {
      setToken(null);
      setAllowedViews([]);
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  /** Helper para resolver íconos de VISTA con fallback */
  const getViewIcon = (name?: string) => {
    const key = (name || "").trim() as LucideIconName;
    return (Icons as any)[key] || Icons[DEFAULT_VIEW_ICON];
  };

  /** Helper para renderizar el encabezado del MÓDULO (logo o ícono) */
  const ModuleHeader: React.FC<{ moduleName: string }> = ({ moduleName }) => {
    const meta = MODULE_META_MAP[moduleName];
    // Si el backend te da logo por view.module.logo, úsalo aquí como primer intento:
    // const backendLogo = modules[moduleName]?.[0]?.module?.logo; // si existiera
    // Prioridad: backendLogo → meta.logoSrc → meta.icon → DEFAULT_MODULE_ICON
    const Icon =
      (meta?.icon && (Icons as any)[meta.icon]) ||
      Icons[DEFAULT_MODULE_ICON];

    return (
      <div className="flex items-center gap-2">
        {/* Si usas logo por imagen: 
        {backendLogo ? (
          <Image src={backendLogo} alt={moduleName} width={18} height={18} />
        ) : meta?.logoSrc ? (
          <Image src={meta.logoSrc} alt={moduleName} width={18} height={18} />
        ) : ( */}
          <Icon size={18} />
        {/* )} */}
        <span>{moduleName}</span>
      </div>
    );
  };

  return (
    <div
      className={cn(
        `${open ? "w-64" : "w-0 -translate-x-full"} transition-all duration-300 asm-gradient border-r border-asm-medium-gold/30 flex flex-col h-full overflow-y-auto`,
        "pb-12",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-asm-medium-gold/30">
        <Link href="/" className="flex justify-center">
          <img 
            src="/recursos/Logos-02.png" 
            alt="ASM Logo" 
            className="h-28 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
          />
        </Link>
      </div>

      {/* Body */}
      <div className="flex-1 py-4 overflow-y-auto px-3">
        {/* Inicio */}
        <Link
          href="/"
          className={cn(
            "flex items-center px-4 py-2 mb-2 rounded-md transition-colors duration-200",
            pathname === "/"
              ? "bg-asm-medium-gold text-white"
              : "text-asm-light-gold hover:bg-asm-medium-gold/20"
          )}
        >
          <Icons.Home size={18} className="mr-2" />
          <span>Inicio</span>
        </Link>

        {/* Título sección */}
        <div className="px-4 py-2 text-xs font-medium text-asm-light-gold/70 uppercase tracking-wider">
          Módulos
        </div>

        {/* Módulos */}
        {sortedModuleNames.map((moduleName) => {
          const views = sortViews(modules[moduleName]);
          const isOpen = !!expanded[moduleName];

          return (
            <div key={moduleName} className="mb-1">
              <button
                onClick={() => toggleModule(moduleName)}
                className="w-full flex items-center justify-between px-4 py-2 text-asm-light-gold hover:bg-asm-medium-gold/20 cursor-pointer rounded-md transition-colors duration-200"
                aria-expanded={isOpen}
                aria-controls={`module-${moduleName}`}
              >
                <ModuleHeader moduleName={moduleName} />
                {isOpen ? <Icons.ChevronDown size={16} /> : <Icons.ChevronRight size={16} />}
              </button>

              {isOpen && (
                <div id={`module-${moduleName}`} className="pl-6 text-sm space-y-1 mt-1 mb-2">
                  {views.map((view) => {
                    const Icon = getViewIcon(view.icon);
                    const active = pathname === view.view_path;
                    return (
                      <Link
                        key={view.view_path}
                        href={view.view_path}
                        className={cn(
                          "flex items-center px-4 py-1.5 rounded-md transition-colors duration-200",
                          active
                            ? "bg-asm-medium-gold text-white"
                            : "text-asm-light-gold hover:bg-asm-medium-gold/20"
                        )}
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

      {/* Footer */}
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
