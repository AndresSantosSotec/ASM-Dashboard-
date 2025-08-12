"use client";
import type { ReactNode } from "react";
import Permission from "@/components/Permission";

export default function TareasAsesorLayout({ children }: { children: ReactNode }) {
  return <Permission viewPath="/tareas-asesor" action="view">{children}</Permission>;
}

