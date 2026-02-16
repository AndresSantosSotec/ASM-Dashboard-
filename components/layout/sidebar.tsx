"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { AllowedView } from "@/contexts/AuthContext";
import { useSystemColors } from "@/hooks/useCustomization";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { api } from "@/services/api";

type LucideIconName = keyof typeof Icons;

type ModuleMeta = {
  name: string;
  order: number;
  icon?: LucideIconName;
  logoSrc?: string;
};

const MODULES_META: ModuleMeta[] = [
  { name: "Prospectos y Asesores", order: 1, icon: "Users" },
  { name: "Inscripción", order: 2, icon: "FileText" },
  { name: "Académico", order: 3, icon: "BookOpen" },
  { name: "Finanzas y Pagos", order: 4, icon: "DollarSign" },
  { name: "Docentes", order: 5, icon: "GraduationCap" as LucideIconName },
  { name: "Estudiantes", order: 6, icon: "Users" },
  { name: "Seguridad", order: 7, icon: "Shield" },
  { name: "Administración", order: 8, icon: "Settings" },
];

const MODULE_META_MAP: Record<string, ModuleMeta> = Object.fromEntries(
  MODULES_META.map((m) => [m.name, m])
);

const DEFAULT_MODULE_ICON: LucideIconName = "Folder";
const DEFAULT_VIEW_ICON: LucideIconName = "File";

export default function Sidebar({ open, isMobile, className }: { open?: boolean; isMobile?: boolean; className?: string }) {
  const { allowedViews, setToken, setAllowedViews } = useAuth();
  const { sidebarImage, primary, secondary } = useSystemColors();
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Obtener versión desde variable de entorno
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "3.0.0";

  // En desktop, si open trasmitido es false, estamos en modo "miniatura" (collapsed).
  const isCollapsed = !isMobile && !open;

  const uniqueViews = useMemo(() => {
    const map = new Map<string, AllowedView>();
    for (const v of allowedViews) {
      if (!map.has(v.view_path)) map.set(v.view_path, v);
    }
    return Array.from(map.values());
  }, [allowedViews]);

  const modules = useMemo(() => {
    const grouped: Record<string, AllowedView[]> = {};
    for (const view of uniqueViews) {
      const key = view.module?.name ?? "General";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(view);
    }
    return grouped;
  }, [uniqueViews]);

  const sortedModuleNames = useMemo(() => {
    const names = Object.keys(modules);
    return names.sort((a, b) => {
      const ma = MODULE_META_MAP[a];
      const mb = MODULE_META_MAP[b];
      if (ma && mb) return ma.order - mb.order;
      if (ma && !mb) return -1;
      if (!ma && mb) return 1;
      return a.localeCompare(b);
    });
  }, [modules]);

  function sortViews(views: AllowedView[]) {
    return [...views].sort((a, b) => {
      const ao = (a as any).order_index ?? 9999;
      const bo = (b as any).order_index ?? 9999;
      if (ao !== bo) return ao - bo;
      return a.menu.localeCompare(b.menu);
    });
  }

  const toggleModule = (module: string) => {
    if (isCollapsed) return;
    setExpanded((prev) => ({ ...prev, [module]: !prev[module] }));
  };

  const isModuleActive = (moduleName: string) => {
    const views = modules[moduleName] || [];
    return views.some((v) => pathname === v.view_path || pathname?.startsWith(v.view_path + "/"));
  };

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

  const getViewIcon = (name?: string) => {
    const key = (name || "").trim() as LucideIconName;
    return (Icons as any)[key] || Icons[DEFAULT_VIEW_ICON];
  };

  const ModuleHeader: React.FC<{ moduleName: string }> = ({ moduleName }) => {
    const meta = MODULE_META_MAP[moduleName];
    const Icon = (meta?.icon && (Icons as any)[meta.icon]) || Icons[DEFAULT_MODULE_ICON];

    return (
      <div className={cn("flex items-center", isCollapsed ? "justify-center w-full" : "gap-2.5")}>
        <div className={cn(
          "flex items-center justify-center rounded-lg transition-all duration-200",
          !isCollapsed ? "w-7 h-7 bg-white/[0.07] group-hover:bg-white/[0.12]" : "w-8 h-8 group-hover:bg-white/[0.1] text-asm-light-gold"
        )}>
          <Icon size={isCollapsed ? 18 : 15} className="text-asm-light-gold/80" />
        </div>
        <span className={cn(
          "font-medium text-[13px] tracking-wide transition-all duration-300 overflow-hidden whitespace-nowrap",
          isCollapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100"
        )}>
          {moduleName}
        </span>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "transition-all duration-300 border-r border-asm-medium-gold/[0.15] flex flex-col h-full overflow-y-auto overflow-x-hidden",
        "pb-6", // Increased padding bottom for better mobile touch area/version visibility
        isCollapsed ? "w-[80px]" : "w-64",
        className
      )}
      style={
        sidebarImage
          ? {
              backgroundImage: `url(${sidebarImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
            }
          : {
              background: `linear-gradient(135deg, ${primary}99 0%, ${secondary}99 100%)`,
            }
      }
    >
      {/* ─── Logo Area ─── */}
      <div className={cn("flex flex-col transition-all duration-300", isCollapsed ? "p-3 items-center" : "p-5")}>
        <Link href="/" className="flex justify-center group w-full">
          <div className="relative flex items-center justify-center h-16">
            {isCollapsed ? (
              // Icono/Logo mini
              <div className="w-10 h-10 bg-asm-medium-gold/20 rounded-full flex items-center justify-center border border-asm-medium-gold/30 shadow-gold">
                <Icons.Shield size={20} className="text-asm-light-gold" />
              </div>
            ) : (
              // Ruta con /webpanel/ para producción - cambiar según ambiente
              <img
                src="/webpanel/recursos/Logos-02.png"
                alt="ASM Logo"
                className="h-16 w-auto object-contain cursor-pointer transition-all duration-500 group-hover:scale-[1.03] group-hover:brightness-110"
              />
              // Local: src="/recursos/Logos-02.png"
            )}
          </div>
        </Link>
        <div className={cn("sidebar-separator mt-4 transition-opacity duration-300", isCollapsed ? "opacity-30 w-10 mx-auto" : "opacity-100 w-auto")} />
      </div>

      {/* ─── Navigation Body ─── */}
      <div className={cn("flex-1 overflow-y-auto overflow-x-hidden space-y-1 transition-all", isCollapsed ? "px-2" : "px-3")}>
        {/* Inicio */}
        <Link
          href="/"
          title={isCollapsed ? "Inicio" : ""}
          className={cn(
            "flex items-center mb-1 rounded-xl transition-all duration-200 group relative",
            isCollapsed ? "justify-center py-3" : "gap-2.5 px-3 py-2.5",
            pathname === "/"
              ? "bg-gradient-to-r from-asm-medium-gold/90 to-asm-dark-gold/90 text-white shadow-lg shadow-asm-medium-gold/20"
              : "text-asm-light-gold/90 hover:bg-white/[0.08] hover:text-white"
          )}
        >
          <div className={cn(
            "flex items-center justify-center rounded-lg transition-all duration-200",
            !isCollapsed ? "w-8 h-8 bg-white/[0.05] group-hover:bg-white/[0.1]" : ""
          )}>
            <Icons.Home size={isCollapsed ? 20 : 16} />
          </div>
          <span className={cn(
            "font-medium text-[13px] transition-all duration-300 overflow-hidden whitespace-nowrap",
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            Inicio
          </span>
          {!isCollapsed && pathname === "/" && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[60%] w-[3px] bg-white/50 rounded-r-md" />}
        </Link>

        {/* Section title */}
        <div className={cn("transition-all duration-300", isCollapsed ? "py-2 text-center" : "px-3 pt-4 pb-2")}>
          <p className="text-[10px] font-semibold text-asm-light-gold/40 uppercase tracking-[0.15em] whitespace-nowrap overflow-hidden">
            {isCollapsed ? "..." : "Módulos"}
          </p>
        </div>

        {/* ─── Módulos ─── */}
        {sortedModuleNames.map((moduleName) => {
          const views = sortViews(modules[moduleName]);
          const isOpen = !!expanded[moduleName];
          const moduleActive = isModuleActive(moduleName);

          return (
            <div key={moduleName} className="mb-0.5 relative group/module">
              {/* Tooltip on hover (collapsed) */}
              {isCollapsed && (
                <div className="absolute left-full top-2 ml-3 z-50 px-3 py-1.5 bg-asm-navy text-asm-light-gold text-xs font-medium rounded-md opacity-0 group-hover/module:opacity-100 pointer-events-none whitespace-nowrap border border-asm-medium-gold/20 shadow-xl transition-opacity duration-200 translate-x-1 group-hover/module:translate-x-0">
                  {moduleName}
                </div>
              )}

              <button
                onClick={() => !isCollapsed && toggleModule(moduleName)}
                className={cn(
                  "w-full flex items-center cursor-pointer rounded-xl transition-all duration-200",
                  isCollapsed ? "justify-center py-3 px-0" : "justify-between px-3 py-2.5",
                  moduleActive && !isOpen
                    ? "bg-white/[0.08] text-white"
                    : "text-asm-light-gold/85 hover:bg-white/[0.06] hover:text-white"
                )}
                aria-expanded={isOpen}
              >
                <ModuleHeader moduleName={moduleName} />
                {!isCollapsed && (
                  <Icons.ChevronRight
                    size={14}
                    className={cn(
                      "text-asm-light-gold/40 transition-transform duration-300",
                      isOpen && "rotate-90"
                    )}
                  />
                )}
              </button>

              {/* Submenú: solo expandir si NO colapsado */}
              {!isCollapsed && isOpen && (
                <div
                  className="pl-5 pr-1 mt-1 mb-2 ml-3 border-l border-asm-medium-gold/[0.12] space-y-0.5 animate-in slide-in-from-top-2 duration-200"
                >
                  {views.map((view) => {
                    const Icon = getViewIcon(view.icon);
                    const active = pathname === view.view_path;
                    return (
                      <Link
                        key={view.view_path}
                        href={view.view_path}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] transition-all duration-200 group/link",
                          active
                            ? "bg-gradient-to-r from-asm-medium-gold/80 to-asm-dark-gold/80 text-white shadow-md shadow-asm-medium-gold/15 font-medium"
                            : "text-asm-light-gold/70 hover:bg-white/[0.06] hover:text-asm-light-gold"
                        )}
                      >
                        <Icon
                          size={14}
                          className={cn(
                            "flex-shrink-0 transition-colors duration-200",
                            active ? "text-white" : "text-asm-light-gold/50 group-hover/link:text-asm-light-gold/80"
                          )}
                        />
                        <span className="truncate">{view.menu}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Footer ─── */}
      <div className={cn("mt-auto transition-all", isCollapsed ? "px-2 pb-2 pt-2" : "px-3 pb-2 pt-2")}>
        <div className="sidebar-separator mb-3" />
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Cerrar Sesión" : ""}
          className={cn(
            "group w-full flex items-center rounded-xl text-red-400/80 hover:bg-red-500/[0.08] hover:text-red-400 transition-all duration-200",
            isCollapsed ? "justify-center py-3" : "gap-2.5 px-3 py-2.5"
          )}
        >
          <div className={cn(
            "flex items-center justify-center rounded-lg bg-red-500/[0.06] group-hover:bg-red-500/[0.12] transition-colors duration-200",
            isCollapsed ? "w-8 h-8" : "w-8 h-8"
          )}>
            <Icons.LogOut size={16} />
          </div>
          <span className={cn(
            "text-[13px] font-medium transition-all duration-300 overflow-hidden whitespace-nowrap",
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            Cerrar Sesión
          </span>
        </button>

        {/* ─── Version Info ─── */}
        <div className={cn(
          "mt-2 text-center transition-all duration-500 overflow-hidden",
          isCollapsed ? "h-0 opacity-0" : "h-auto opacity-100" // Ocultar versión en colapsado para limpieza
        )}>
          <p className="text-[10px] text-asm-light-gold/30 font-mono select-none">
            v{appVersion}
          </p>
        </div>
      </div>
    </div>
  );
}
