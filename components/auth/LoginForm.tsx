"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useGreeting } from "@/hooks/useGreeting";
import { cn } from "@/lib/utils";

const shakeVariants = {
  shake: {
    x: [-10, 10, -10, 10, -5, 5, 0],
    transition: { duration: 0.5 },
  },
};

export interface LoginFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  rememberMe: boolean;
  setRememberMe: (v: boolean) => void;
  isLoading: boolean;
  error: string;
  setError: (v: string) => void;
  onLogin: (e: React.FormEvent) => void;
  showRecovery: boolean;
  toggleRecoveryView: () => void;
  recoveryEmail: string;
  setRecoveryEmail: (v: string) => void;
  recoveryLoading: boolean;
  recoverySuccess: boolean;
  recoveryError: string;
  validationErrors: string[];
  onRecoverySubmit: (e: React.FormEvent) => void;
}

export function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  isLoading,
  error,
  setError,
  onLogin,
  showRecovery,
  toggleRecoveryView,
  recoveryEmail,
  setRecoveryEmail,
  recoveryLoading,
  recoverySuccess,
  recoveryError,
  validationErrors,
  onRecoverySubmit,
}: LoginFormProps) {
  const { text: greetingText, emoji: greetingEmoji } = useGreeting();
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  if (showRecovery) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex h-full flex-col justify-center px-6 py-10 sm:px-12"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleRecoveryView}
          className="mb-6 w-fit text-[#0f2744] hover:bg-[#0f2744]/10 hover:text-[#0f2744]"
          aria-label="Volver al login"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al login
        </Button>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-[#0f2744] sm:text-3xl"
        >
          Recuperar Contraseña
        </motion.h2>
        <p className="mt-1 text-[#64748b]">Ingresa tu correo y te enviaremos una contraseña temporal.</p>

        {recoverySuccess ? (
          <>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-8 rounded-lg border border-green-200 bg-green-50 p-4"
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Solicitud enviada</h3>
                  <p className="mt-1 text-sm text-green-700">
                    Si el correo está registrado, recibirás un email con tu contraseña temporal. Revisa también spam.
                  </p>
                </div>
              </div>
            </motion.div>
            <Button
              type="button"
              onClick={toggleRecoveryView}
              className="mt-6 w-full bg-[#0f2744] hover:bg-[#0f2744]/90"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Login
            </Button>
          </>
        ) : (
          <form onSubmit={onRecoverySubmit} className="mt-8 space-y-4">
            <AnimatePresence>
              {recoveryError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
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
                  className="list-inside list-disc rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
                >
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
            <div>
              <label htmlFor="recovery-email" className="sr-only">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
                <Input
                  id="recovery-email"
                  type="email"
                  placeholder="Correo electrónico"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="h-12 rounded-xl border-2 pl-10 focus:border-[#0f2744] focus-visible:ring-[#0f2744]"
                  required
                  disabled={recoveryLoading}
                  autoFocus
                  aria-label="Correo electrónico para recuperación"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={recoveryLoading}
              className="h-12 w-full rounded-xl bg-[#8b1a2b] font-semibold hover:bg-[#c0392b]"
            >
              {recoveryLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Enviando...
                </span>
              ) : (
                "Enviar contraseña temporal"
              )}
            </Button>
          </form>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="flex flex-col justify-center px-6 py-10 sm:px-12"
    >
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-2xl font-bold text-[#0f2744] sm:text-3xl"
      >
        {greetingEmoji} {greetingText}
      </motion.h2>
      <p className="mt-1 text-[#64748b]">Ingresa tus credenciales para continuar</p>

      <motion.form
        onSubmit={onLogin}
        className="mt-8 space-y-5"
        variants={shakeVariants}
        animate={error ? "shake" : ""}
      >
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          animate={emailFocused ? { scale: 1.01 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          <label htmlFor="email" className="sr-only">
            Correo electrónico
          </label>
          <Mail
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]"
            aria-hidden
          />
          <Input
            id="email"
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            className={cn(
              "h-12 rounded-xl border-2 pl-10 transition-colors",
              "focus:border-[#0f2744] focus-visible:ring-[#0f2744]"
            )}
            required
            autoComplete="email"
            aria-label="Correo electrónico"
          />
        </motion.div>

        <motion.div
          animate={passwordFocused ? { scale: 1.01 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          <label htmlFor="password" className="sr-only">
            Contraseña
          </label>
          <Lock
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]"
            aria-hidden
          />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            className={cn(
              "h-12 rounded-xl border-2 pl-10 pr-10 transition-colors",
              "focus:border-[#0f2744] focus-visible:ring-[#0f2744]"
            )}
            required
            autoComplete="current-password"
            aria-label="Contraseña"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#1a1a2e]"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
              aria-label="Recordarme"
            />
            <label
              htmlFor="remember"
              className="text-sm font-medium leading-none text-[#1a1a2e] peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Recordarme
            </label>
          </div>
          <button
            type="button"
            onClick={toggleRecoveryView}
            className="text-sm text-[#0f2744] underline hover:no-underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#8b1a2b] font-semibold text-white transition-colors hover:bg-[#c0392b] disabled:opacity-80"
            aria-busy={isLoading}
            aria-label={isLoading ? "Verificando credenciales" : "Iniciar sesión"}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                  />
                  Verificando...
                </motion.div>
              ) : (
                <motion.span
                  key="text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Iniciar Sesión →
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      </motion.form>
    </motion.div>
  );
}
