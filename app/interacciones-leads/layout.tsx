"use client";
import type { ReactNode } from "react";
import Permission from "@/components/Permission";

export default function InteraccionesLeadsLayout({ children }: { children: ReactNode }) {
  return <Permission viewPath="/interacciones-leads" action="view">{children}</Permission>;
}

