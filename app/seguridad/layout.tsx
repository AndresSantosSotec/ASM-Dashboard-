"use client";
import type { ReactNode } from "react";
import Permission from "@/components/Permission";

export default function SeguridadLayout({ children }: { children: ReactNode }) {
  return <Permission viewPath="/seguridad" action="view">{children}</Permission>;
}

