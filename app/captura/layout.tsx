"use client";
import type { ReactNode } from "react";
import Permission from "@/components/Permission";

export default function CapturaLayout({ children }: { children: ReactNode }) {
  return <Permission viewPath="/captura" action="view">{children}</Permission>;
}

