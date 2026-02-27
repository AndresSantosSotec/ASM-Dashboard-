"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMobile } from "@/hooks/use-mobile";
import { FormularioLogin } from "./FormularioLogin";
import { FormularioRecuperar } from "./FormularioRecuperar";

export type VistaLogin = "login" | "recuperar";

export interface CardLoginProps {
  vista: VistaLogin;
  setVista: (v: VistaLogin) => void;
  // Login
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
  // Recuperar
  recoveryEmail: string;
  setRecoveryEmail: (v: string) => void;
  recoveryLoading: boolean;
  recoverySuccess: boolean;
  recoveryError: string;
  validationErrors: string[];
  onRecoverySubmit: (e: React.FormEvent) => void;
}

export function CardLogin({
  vista,
  setVista,
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
  recoveryEmail,
  setRecoveryEmail,
  recoveryLoading,
  recoverySuccess,
  recoveryError,
  validationErrors,
  onRecoverySubmit,
}: CardLoginProps) {
  const isMobile = useMobile();

  const positionClass = isMobile
    ? "mx-auto"
    : vista === "login"
      ? "ml-auto mr-0 md:mr-16"
      : "mr-auto ml-0 md:ml-16";

  return (
    <div className="flex min-h-screen items-center px-6 py-10 md:px-12 lg:px-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={vista}
          initial={{
            x: isMobile ? 0 : vista === "login" ? 100 : -100,
            opacity: 0,
            scale: 0.95,
          }}
          animate={{
            x: 0,
            opacity: 1,
            scale: 1,
          }}
          exit={{
            x: isMobile ? 0 : vista === "login" ? -100 : 100,
            opacity: 0,
            scale: 0.95,
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 25,
          }}
          className={`w-full max-w-md rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur-xl md:p-10 ${positionClass}`}
        >
          {vista === "login" ? (
            <FormularioLogin
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              rememberMe={rememberMe}
              setRememberMe={setRememberMe}
              loading={loading}
              error={error}
              onLogin={onLogin}
              onIrRecuperar={() => setVista("recuperar")}
            />
          ) : (
            <FormularioRecuperar
              recoveryEmail={recoveryEmail}
              setRecoveryEmail={setRecoveryEmail}
              recoveryLoading={recoveryLoading}
              recoverySuccess={recoverySuccess}
              recoveryError={recoveryError}
              validationErrors={validationErrors}
              onRecoverySubmit={onRecoverySubmit}
              onVolver={() => setVista("login")}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
