"use client";
import type { ReactNode } from "react";
import Permission from "@/components/Permission";

export default function GestionLayout({ children }: { children: ReactNode }) {
  return <Permission viewPath="/gestion" action="view">{children}</Permission>;
}

