"use client";
import type { ReactNode } from "react";
import Permission from "@/components/Permission";

export default function EstudiantesLayout({ children }: { children: ReactNode }) {
  return <Permission viewPath="/estudiantes" action="view">{children}</Permission>;
}

