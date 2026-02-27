"use client";

/**
 * Estado global del sidebar (abierto/cerrado, mobile).
 * Usa React Context; si prefieres Zustand, sustituye por:
 *
 * import { create } from 'zustand'
 * export const useSidebar = create<SidebarStore>((set) => ({
 *   isOpen: true, isMobile: false,
 *   toggle: () => set(s => ({ isOpen: !s.isOpen })),
 *   setOpen: (open) => set({ isOpen: open }),
 *   setMobile: (v) => set({ isMobile: v }),
 * }))
 * Y en el layout, elimina SidebarProvider y usa useSidebar() donde haga falta.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const SIDEBAR_WIDTH = 256;

interface SidebarContextType {
  isOpen: boolean;
  isMobile: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  setMobile: (v: boolean) => void;
  sidebarWidth: number;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const setOpen = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  const setMobile = useCallback((v: boolean) => {
    setIsMobile(v);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w >= 1024) {
        setIsMobile(false);
        setIsOpen(true);
      } else if (w >= 768) {
        setIsMobile(false);
        setIsOpen(false);
      } else {
        setIsMobile(true);
        setIsOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        isMobile,
        toggle,
        setOpen,
        setMobile,
        sidebarWidth: SIDEBAR_WIDTH,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextType {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return ctx;
}

export { SIDEBAR_WIDTH };
