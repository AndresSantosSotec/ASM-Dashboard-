"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
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

  const modules = useMemo(() => {
    const grouped: Record<string, typeof allowedViews> = {};
    allowedViews.forEach((view) => {
      const key = view.module?.name || "General";
      grouped[key] = grouped[key] || [];
      grouped[key].push(view);
    });
    return grouped;
  }, [allowedViews]);

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
      <div className="flex-1 py-2 overflow-y-auto">
        {Object.entries(modules).map(([moduleName, views]) => (
          <div key={moduleName} className="mb-3">
            <div className="px-4 py-2 text-sm font-medium text-asm-light-gold/70">{moduleName}</div>
            {views.map((view) => {
              const Icon = (Icons as any)[view.icon] || Icons.File;
              return (
                <Link
                  key={view.view_path}
                  href={view.view_path}
                  className={`flex items-center px-4 py-1.5 rounded-md ${pathname === view.view_path ? "bg-asm-medium-gold text-white" : "text-asm-light-gold hover:bg-asm-medium-gold/20"}`}
                >
                  <Icon size={16} className="mr-2" />
                  <span>{view.menu}</span>
                </Link>
              );
            })}
          </div>
        ))}
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
