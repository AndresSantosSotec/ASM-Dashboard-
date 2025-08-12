"use client";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Permission from "@/components/Permission";

export const metadata: Metadata = {
  title: "Portal Docente | Blue Atlas",
  description: "Portal centralizado para docentes",
};

export default function DocenteLayout({ children }: { children: ReactNode }) {
  return <Permission viewPath="/docente" action="view">{children}</Permission>;
}

