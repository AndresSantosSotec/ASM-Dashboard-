"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMobile } from "@/hooks/use-mobile";

const MODULOS = [
  "Gestión de Prospectos",
  "Control Académico",
  "Panel de Asesores",
  "Reportes y Analytics",
  "Administración General",
];

export function AnimatedBackground() {
  const isMobile = useMobile();
  const [moduloActual, setModuloActual] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setModuloActual((prev) => (prev + 1) % MODULOS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="login-gradient-bg relative h-[120px] w-full shrink-0 overflow-hidden rounded-b-2xl md:hidden"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex h-full flex-col items-center justify-center px-4"
        >
          <h1 className="text-2xl font-black tracking-tight text-white">GBS</h1>
          <p className="mt-0.5 text-sm text-white/70">SIP</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="login-gradient-bg relative hidden h-full w-full overflow-hidden md:block">

      {/* Partículas */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute h-1 w-1 rounded-full bg-white/30"
          style={{
            top: `${(i * 7 + 3) % 100}%`,
            left: `${(i * 11 + 5) % 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + (i % 4),
            repeat: Infinity,
            delay: (i % 3) * 0.8,
          }}
        />
      ))}

      {/* Formas geométricas flotantes */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`shape-${i}`}
          className="absolute rounded-full border border-white/10 bg-white/5"
          style={{
            width: `${80 + i * 40}px`,
            height: `${80 + i * 40}px`,
            top: `${10 + i * 15}%`,
            left: `${5 + (i * 12) % 80}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 180, 360],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Contenido central */}
      <div className="relative z-10 flex h-full flex-col justify-center px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-sm"
        >
          <h1 className="text-6xl font-black tracking-tight text-white lg:text-7xl">
            GBS
          </h1>
          <p className="mt-2 text-lg text-white/70">SIP</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 flex min-h-[2.5rem] items-center"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={moduloActual}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
              className="text-sm text-white/60"
            >
              ✦ {MODULOS[moduloActual]}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
