"use client";

import React, { useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { recoverPassword } from "@/services/password-recovery";
import { FondoAnimado } from "@/components/auth/FondoAnimado";
import { CardLogin, type VistaLogin } from "@/components/auth/CardLogin";

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setAllowedViews, setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [vista, setVista] = useState<VistaLogin>("login");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/login", {
        email,
        password,
      });

      const { id, token, user, allowedViews } = response.data;

      setToken(token);
      setAllowedViews(allowedViews || []);
      setUser(user);
      localStorage.setItem("userId", id);
      localStorage.setItem("user", JSON.stringify(user));

      router.push("/");
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(
        axiosError.response?.data?.error || "Ocurrió un error al iniciar sesión"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryLoading(true);
    setRecoveryError("");
    setValidationErrors([]);
    setRecoverySuccess(false);

    try {
      const response = await recoverPassword(recoveryEmail);

      if (response.success) {
        setRecoverySuccess(true);
        setRecoveryEmail("");
      } else {
        if (response.errors?.email) {
          setValidationErrors(response.errors.email);
        } else {
          setRecoveryError(response.message);
        }
      }
    } catch {
      setRecoveryError("Error inesperado. Por favor, intenta de nuevo.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleSetVista = (nuevaVista: VistaLogin) => {
    setVista(nuevaVista);
    if (nuevaVista === "login") {
      setRecoverySuccess(false);
      setRecoveryError("");
      setValidationErrors([]);
      setRecoveryEmail("");
      setError("");
    }
  };

  return (
    <FondoAnimado>
      <CardLogin
        vista={vista}
        setVista={handleSetVista}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        rememberMe={rememberMe}
        setRememberMe={setRememberMe}
        loading={isLoading}
        error={error}
        onLogin={handleLogin}
        recoveryEmail={recoveryEmail}
        setRecoveryEmail={setRecoveryEmail}
        recoveryLoading={recoveryLoading}
        recoverySuccess={recoverySuccess}
        recoveryError={recoveryError}
        validationErrors={validationErrors}
        onRecoverySubmit={handleRecovery}
      />
    </FondoAnimado>
  );
}
