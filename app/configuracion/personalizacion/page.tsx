"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CustomizationSettings } from "@/components/customization/CustomizationSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CustomizationPage() {
  const { user } = useAuth();

  // Verificar que el usuario es admin
  const isAdmin = user?.role?.name === "admin" || user?.role?.name === "Admin";

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes permiso para acceder a esta página. Solo los administradores pueden personalizar el sistema.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Personalización del Sistema</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configura los colores, imágenes y ajustes generales del sistema
        </p>
      </div>

      <CustomizationSettings />
    </div>
  );
}
