"use client";

import React from "react";
import { Inter } from "next/font/google";
import "@/styles/globals.css"; // Si necesitas cargar estilos globales

const inter = Inter({ subsets: ["latin"] });

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} min-h-screen`}>
      {/* Este layout es "limpio" (sin sidebar ni cabecera) para la página de login */}
      {children}
    </div>
  );
}
