"use client";

import React from "react";

export function FondoAnimado({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: "#0a1628" }}
    >
      {/* Grid de puntos sutil */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Orbes de luz en esquinas */}
      <div
        className="absolute -left-40 -top-40 h-96 w-96 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, #1e40af, transparent)",
        }}
      />
      <div
        className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, #7f1d1d, transparent)",
        }}
      />

      {/* Watermark GBS */}
      <div
        className="absolute bottom-8 left-8 select-none text-8xl font-black text-white/10"
        aria-hidden
      >
        GBS
      </div>

      {children}
    </div>
  );
}
