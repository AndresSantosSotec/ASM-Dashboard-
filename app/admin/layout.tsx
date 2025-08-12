"use client";
import type { ReactNode } from "react";
import Permission from "@/components/Permission";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <Permission viewPath="/admin" action="view">{children}</Permission>;
}

