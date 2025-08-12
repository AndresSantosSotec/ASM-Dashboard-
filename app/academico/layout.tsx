"use client";
import type { ReactNode } from "react";
import Permission from "@/components/Permission";

export default function AcademicoLayout({ children }: { children: ReactNode }) {
  return <Permission viewPath="/academico" action="view">{children}</Permission>;
}

