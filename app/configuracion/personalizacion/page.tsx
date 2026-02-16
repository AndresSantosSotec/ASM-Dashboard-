"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CustomizationSettings } from "@/components/customization/CustomizationSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function CustomizationPage() {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<"checking" | "allowed" | "denied">("checking");
  const [permissionDetails, setPermissionDetails] = useState<string>("");

  useEffect(() => {
    checkPermissions();
  }, [user]);

  const checkPermissions = () => {
    if (!user) {
      setPermissionStatus("denied");
      setPermissionDetails("Usuario no autenticado");
      return;
    }

    // Verificar si es Admin
    const isAdmin = user.role?.name === "admin" || user.role?.name === "Admin";

    if (isAdmin) {
      setPermissionStatus("allowed");
      setPermissionDetails("Acceso como administrador");
    } else {
      setPermissionStatus("denied");
      setPermissionDetails("Solo los administradores pueden acceder a esta sección");
    }
  };

  if (permissionStatus === "checking") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (permissionStatus === "denied") {
    return (
      <div className="p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Acceso denegado:</strong> {permissionDetails}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Personalización del Sistema</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configura los colores, imágenes y ajustes generales del sistema Gaia Business School
        </p>
      </div>

      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Los cambios realizados aquí afectarán a toda la aplicación y serán visibles para todos los usuarios.
        </AlertDescription>
      </Alert>

      <CustomizationSettings />
    </div>
  );
}
