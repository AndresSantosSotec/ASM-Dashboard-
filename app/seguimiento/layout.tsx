"use client";
import type { ReactNode } from "react";
import Permission from "@/components/Permission";

export default function SeguimientoLayout({ children }: { children: ReactNode }) {
  return <Permission viewPath="/seguimiento" action="view">{children}</Permission>;
}

