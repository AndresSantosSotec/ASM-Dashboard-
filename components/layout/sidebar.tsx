"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import type { AllowedView } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { ChevronLeft, LogOut, Shield } from "lucide-react";
import { api } from "@/services/api";
import { SIDEBAR_MODULES_MAP } from "@/lib/sidebar-modules-config";
import { getIcono, getIconComponent } from "@/lib/get-sidebar-icon";
import { useSidebar } from "@/contexts/SidebarContext";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "3.0.0";

export default function Sidebar({ className }: { className?: string } = {}) {
  const { isOpen, sidebarWidth } = useSidebar();
  const { allowedViews, setToken, setAllowedViews, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
      const ma = SIDEBAR_MODULES_MAP[a];
      const mb = SIDEBAR_MODULES_MAP[b];
      if (ma && mb) return ma.order - mb.order;
      if (ma && !mb) return -1;
      if (!ma && mb) return 1;
      return a.localeCompare(b);
    });
  }, [modules]);

  function sortViews(views: AllowedView[]) {
    return [...views].sort((a, b) => {
      const ao = (a as AllowedView & { order_index?: number }).order_index ?? 9999;
      const bo = (b as AllowedView & { order_index?: number }).order_index ?? 9999;
      if (ao !== bo) return ao - bo;
      return a.menu.localeCompare(b.menu);
    });
  }

  const toggleModule = (moduleName: string) => {
    setExpanded((prev) => ({ ...prev, [moduleName]: !prev[moduleName] }));
  };

  const isModuleActive = (moduleName: string) => {
    const views = modules[moduleName] || [];
    return views.some(
      (v) => pathname === v.view_path || pathname?.startsWith(v.view_path + "/")
    );
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

  const userDisplayName = user?.name ?? "";
  const userRole = user?.role?.name ?? user?.rol ?? "";

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="border-b border-[#1e293b] px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b1a2b] to-[#5b1020] shadow-lg shadow-red-900/40">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              Gaia
            </p>
            <p className="text-xs text-[#64748b]">Panel de Gestión</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#1e293b]">
        {/* Inicio */}
        <div className="mb-2 px-2">
          <Link
            href="/"
            className={cn(
              "relative flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-200",
              pathname === "/"
                ? "bg-gradient-to-l from-[#8b1a2b]/80 to-[#5b1020]/60 font-semibold text-white shadow-sm"
                : "text-[#94a3b8] hover:bg-[#1e293b] hover:text-white"
            )}
          >
            {pathname === "/" && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-[#e11d48]"
              />
            )}
            <span className="flex shrink-0 [&>svg]:size-4">
              {getIcono("inicio", "h-4 w-4")}
            </span>
            <span className="flex-1 truncate text-left">Inicio</span>
          </Link>
        </div>

        <div className="mb-2 mt-1 px-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#475569]">
            Módulos
          </p>
        </div>

        <div className="space-y-0.5 px-2">
          {sortedModuleNames.map((moduleName) => {
            const views = sortViews(modules[moduleName]);
            const isOpen = !!expanded[moduleName];
            const moduleActive = isModuleActive(moduleName);
            const hasSubs = views.length > 0;

            return (
              <div key={moduleName} className="relative">
                <motion.button
                  type="button"
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => hasSubs && toggleModule(moduleName)}
                  className={cn(
                    "relative flex w-full items-center gap-3 rounded-xl px-4 py-2.5 mx-2 text-left text-sm transition-all duration-200 group",
                    moduleActive && !isOpen
                      ? "bg-gradient-to-l from-[#8b1a2b]/80 to-[#5b1020]/60 font-semibold text-white shadow-sm"
                      : "text-[#94a3b8] hover:bg-[#1e293b] hover:text-white"
                  )}
                  aria-expanded={isOpen}
                >
                  {moduleActive && !isOpen && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#e11d48]"
                    />
                  )}
                  <span
                    className={cn(
                      "flex shrink-0 transition-colors",
                      moduleActive && !isOpen
                        ? "text-white"
                        : "text-[#64748b] group-hover:text-[#94a3b8]"
                    )}
                  >
                    {getIcono(moduleName, "h-4 w-4")}
                  </span>
                  <span className="flex-1 truncate">{moduleName}</span>
                  {hasSubs && (
                    <ChevronLeft
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                        isOpen && "rotate-[-90deg]",
                        moduleActive && !isOpen ? "text-white/70" : "text-[#475569]"
                      )}
                    />
                  )}
                </motion.button>

                <AnimatePresence>
                  {isOpen && hasSubs && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pl-4 pr-2"
                    >
                      <div className="ml-2 border-l border-[#1e293b] pl-3 py-1 space-y-0.5">
                        {views.map((view) => {
                          const active =
                            pathname === view.view_path ||
                            pathname?.startsWith(view.view_path + "/");
                          const IconComponent = getIconComponent(
                            view.icon || view.menu
                          );
                          return (
                            <Link
                              key={view.view_path}
                              href={view.view_path}
                              className={cn(
                                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all",
                                active
                                  ? "bg-[#8b1a2b]/20 font-medium text-white"
                                  : "text-[#94a3b8] hover:bg-[#1e293b] hover:text-white"
                              )}
                            >
                              <IconComponent className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{view.menu}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-[#1e293b] px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1e293b]">
            <span className="text-xs font-bold text-white">
              {userDisplayName[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">
              {userDisplayName || "Usuario"}
            </p>
            <p className="truncate text-[11px] text-[#64748b]">
              {userRole || "—"}
            </p>
          </div>
        </div>

        <motion.button
          type="button"
          whileHover={{ x: 2 }}
          onClick={handleLogout}
          className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-[#64748b] transition-all hover:bg-red-950/30 hover:text-red-400"
        >
          <LogOut className="h-4 w-4 group-hover:text-red-400" />
          <span>Cerrar Sesión</span>
        </motion.button>

        <p className="mt-3 text-center text-[10px] text-[#334155]">
          v{APP_VERSION}
        </p>
      </div>
    </>
  );

  return (
    <motion.aside
      animate={{ x: isOpen ? 0 : -sidebarWidth }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-[#1e293b] bg-[#0f172a] shadow-[4px_0_24px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      {sidebarContent}
    </motion.aside>
  );
}
