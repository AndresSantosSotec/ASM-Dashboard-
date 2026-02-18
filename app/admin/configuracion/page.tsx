"use client";

import React from "react";
import { CustomizationSettings } from "@/components/customization/CustomizationSettings";
import { AlertCircle, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ConfiguracionGeneralPage() {
  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-6 w-6 text-[#0E2B49]" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Configuración General
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Personaliza los colores, logos, nombre y ajustes generales del sistema
        </p>
      </div>

      <Alert className="mb-6 border-[#0E2B49]/20 bg-[#0E2B49]/5">
        <AlertCircle className="h-4 w-4 text-[#0E2B49]" />
        <AlertDescription className="text-[#0E2B49]">
          Los cambios realizados aquí afectan a toda la aplicación y son visibles para todos los usuarios.
        </AlertDescription>
      </Alert>

      <CustomizationSettings />
    </div>
  );
}
