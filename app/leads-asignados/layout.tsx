"use client";
import type { ReactNode } from "react";
import Permission from "@/components/Permission";

export default function LeadsAsignadosLayout({ children }: { children: ReactNode }) {
  return <Permission viewPath="/leads-asignados" action="view">{children}</Permission>;
}

