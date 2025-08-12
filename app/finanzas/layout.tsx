"use client";
import type { ReactNode } from "react";
import Permission from "@/components/Permission";

export default function FinanzasLayout({ children }: { children: ReactNode }) {
  return <Permission viewPath="/finanzas" action="view">{children}</Permission>;
}

