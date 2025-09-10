"use client";

import React from "react";
import "@/styles/globals.css"; // Si necesitas cargar estilos globales

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-sans min-h-screen">
      {/* Este layout es "limpio" (sin sidebar ni cabecera) para la página de login */}
      {children}
    </div>
  );
}
