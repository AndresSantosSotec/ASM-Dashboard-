"use client";
import type { ReactNode } from "react";
import Permission from "@/components/Permission";

export default function ImportarLeadsLayout({ children }: { children: ReactNode }) {
  return <Permission viewPath="/importar-leads" action="view">{children}</Permission>;
}

