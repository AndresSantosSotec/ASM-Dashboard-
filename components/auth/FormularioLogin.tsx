"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
} from "lucide-react";
import { containerVariants, itemVariants } from "./motion-variants";

export interface FormularioLoginProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  rememberMe: boolean;
  setRememberMe: (v: boolean) => void;
  loading: boolean;
  error: string;
  onLogin: (e: React.FormEvent) => void;
  onIrRecuperar: () => void;
}

export function FormularioLogin({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  loading,
  error,
  onLogin,
  onIrRecuperar,
}: FormularioLoginProps) {
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const hora = typeof window !== "undefined" ? new Date().getHours() : 9;
  const saludo =
    hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";
  const saludoEmoji = hora < 12 ? "🌅" : hora < 18 ? "☀️" : "🌙";

  return (
    <motion.form
      onSubmit={onLogin}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Logo GBS — sin emoji */}
      <motion.div
        variants={itemVariants}
        className="mb-6 flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f2744]">
          <span className="text-sm font-black text-white">GBS</span>
        </div>
        <div>
          <p className="text-sm font-bold text-[#0f2744]">
            Gaia Business School
          </p>
          <p className="text-xs text-muted-foreground">
            Panel de Administración
          </p>
        </div>
      </motion.div>

      {/* Saludo */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-[#0f2744]">
          {saludoEmoji} {saludo}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ingresa tus credenciales para continuar
        </p>
      </motion.div>

      {/* Error animado */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campo Email */}
      <motion.div variants={itemVariants} className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-[#0f2744]">
          Correo Electrónico
        </label>
        <motion.div
          animate={{
            scale: emailFocused ? 1.01 : 1,
            boxShadow: emailFocused
              ? "0 0 0 3px rgba(15,39,68,0.15)"
              : "0 0 0 0px transparent",
          }}
          className="relative overflow-hidden rounded-xl"
        >
          <Mail
            className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            placeholder="correo@empresa.com"
            className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm transition-colors focus:border-[#0f2744] focus:bg-white focus:outline-none"
            required
            autoComplete="email"
            aria-label="Correo electrónico"
          />
        </motion.div>
      </motion.div>

      {/* Campo Contraseña */}
      <motion.div variants={itemVariants} className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-[#0f2744]">
          Contraseña
        </label>
        <motion.div
          animate={{
            scale: passFocused ? 1.01 : 1,
            boxShadow: passFocused
              ? "0 0 0 3px rgba(15,39,68,0.15)"
              : "0 0 0 0px transparent",
          }}
          className="relative rounded-xl"
        >
          <Lock
            className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPassFocused(true)}
            onBlur={() => setPassFocused(false)}
            placeholder="••••••••••"
            className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 py-3 pl-10 pr-10 text-sm transition-colors focus:border-[#0f2744] focus:bg-white focus:outline-none"
            required
            autoComplete="current-password"
            aria-label="Contraseña"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-[#0f2744]"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </motion.div>
      </motion.div>

      {/* Recordar + Olvidaste */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <label className="flex cursor-pointer select-none items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="cursor-pointer rounded border-gray-300 text-[#0f2744]"
            aria-label="Recordarme"
          />
          <span className="text-muted-foreground">Recordarme</span>
        </label>

        <motion.button
          type="button"
          whileHover={{ x: -3 }}
          onClick={onIrRecuperar}
          className="text-sm font-medium text-[#8b1a2b] transition-colors hover:underline"
        >
          ¿Olvidaste tu contraseña? →
        </motion.button>
      </motion.div>

      {/* Botón Submit */}
      <motion.div variants={itemVariants}>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8b1a2b] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/30 transition-all hover:bg-[#a01f33] disabled:cursor-not-allowed disabled:opacity-70"
          aria-busy={loading}
          aria-label={loading ? "Verificando credenciales" : "Iniciar sesión"}
        >
          {loading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
              />
              Verificando...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Iniciar Sesión
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.form>
  );
}
