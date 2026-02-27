"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  ArrowLeft,
  KeyRound,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { containerVariants, itemVariants } from "./motion-variants";

export interface FormularioRecuperarProps {
  recoveryEmail: string;
  setRecoveryEmail: (v: string) => void;
  recoveryLoading: boolean;
  recoverySuccess: boolean;
  recoveryError: string;
  validationErrors: string[];
  onRecoverySubmit: (e: React.FormEvent) => void;
  onVolver: () => void;
}

export function FormularioRecuperar({
  recoveryEmail,
  setRecoveryEmail,
  recoveryLoading,
  recoverySuccess,
  recoveryError,
  validationErrors,
  onRecoverySubmit,
  onVolver,
}: FormularioRecuperarProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Botón volver */}
      <motion.button
        type="button"
        variants={itemVariants}
        whileHover={{ x: -3 }}
        onClick={onVolver}
        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-[#0f2744]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio de sesión
      </motion.button>

      {/* Ícono y título */}
      <motion.div variants={itemVariants}>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f2744]/10">
          <KeyRound className="h-6 w-6 text-[#0f2744]" />
        </div>
        <h1 className="text-2xl font-bold text-[#0f2744]">
          Recuperar contraseña
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Te enviaremos un enlace a tu correo registrado
        </p>
      </motion.div>

      {/* Estado de éxito o formulario */}
      <AnimatePresence mode="wait">
        {recoverySuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-3 py-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
            >
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </motion.div>
            <p className="font-semibold text-[#0f2744]">¡Correo enviado!</p>
            <p className="text-sm text-muted-foreground">
              Revisa tu bandeja de entrada y sigue las instrucciones
            </p>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              onClick={onVolver}
              className="mt-4 text-sm font-medium text-[#8b1a2b] hover:underline"
            >
              ← Volver al login
            </motion.button>
          </motion.div>
        ) : (
          <motion.div key="form" className="space-y-4">
            {/* Errores */}
            <AnimatePresence>
              {recoveryError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {recoveryError}
                </motion.div>
              )}
              {validationErrors.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="list-inside list-disc rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
                >
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>

            <form onSubmit={onRecoverySubmit} className="space-y-4">
              <motion.div variants={itemVariants} className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[#0f2744]">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="correo@empresa.com"
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm transition-colors focus:border-[#0f2744] focus:bg-white focus:outline-none"
                    required
                    disabled={recoveryLoading}
                    autoComplete="email"
                    aria-label="Correo electrónico para recuperación"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={recoveryLoading || !recoveryEmail.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f2744] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition-colors hover:bg-[#1a3a5c] disabled:opacity-50"
                  aria-busy={recoveryLoading}
                >
                  {recoveryLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          ease: "linear",
                        }}
                        className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                      />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar enlace de recuperación
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
