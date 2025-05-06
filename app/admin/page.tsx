"use client"

import React, { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings as LucideSettings } from "lucide-react"

// Importa los componentes existentes
import LeadManagement from "@/components/admin/lead-management"
import { Advisors } from "@/components/admin/advisors"
import { Performance } from "@/components/admin/performance"
import { Reports } from "@/components/admin/reports"
import { AdvisorActivity } from "@/components/admin/advisor-activity"
import { AlertManagement } from "@/components/admin/alert-management"
import Duplicates from "@/components/admin/duplicates"
import { GestionEstadosCuenta } from "@/components/admin/gestion-estados-cuenta"
import { GruposCorreoModal } from "@/components/admin/grupos-correo-modal"
import { Settings } from "@/components/admin/settings"  // Este es el pendiente

export default function AdminPanel() {
  const [activeAdminTab, setActiveAdminTab] = useState("leads")
  const [searchTerm, setSearchTerm] = useState("")
  const [fecha, setFecha] = useState("2025-03-08")

  return (
    <div className="p-6 bg-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Panel de Administración</h1>
        <Button variant="outline" className="flex items-center gap-2">
          <LucideSettings className="h-4 w-4" />
          Configuración
        </Button>
      </div>

      <h2 className="text-xl font-bold mb-4">Panel de Administración de Prospectos</h2>

      <Tabs value={activeAdminTab} onValueChange={setActiveAdminTab} className="mb-6">
        <TabsList className="w-full grid grid-cols-9 h-auto">
          <TabsTrigger value="leads" className="py-3">Gestión de Leads</TabsTrigger>
          <TabsTrigger value="asesores" className="py-3">Asesores</TabsTrigger>
          <TabsTrigger value="reportes" className="py-3">Reportes</TabsTrigger>
          <TabsTrigger value="actividad" className="py-3">Actividad Diaria</TabsTrigger>
          <TabsTrigger value="alertas" className="py-3">Gestión de Alertas</TabsTrigger>
          <TabsTrigger value="duplicados" className="py-3">Duplicados</TabsTrigger>

          <TabsTrigger value="configuracion" className="py-3">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="border rounded-lg p-6">
          <LeadManagement />
        </TabsContent>

        <TabsContent value="asesores" className="border rounded-lg p-6">
          <Advisors />
        </TabsContent>

        <TabsContent value="rendimiento" className="border rounded-lg p-6">
          <Performance />
        </TabsContent>

        <TabsContent value="reportes" className="border rounded-lg p-6">
          <Reports />
        </TabsContent>

        <TabsContent value="actividad" className="border rounded-lg p-6">
          <AdvisorActivity />
        </TabsContent>

        <TabsContent value="alertas" className="border rounded-lg p-6">
          <AlertManagement />
        </TabsContent>

        <TabsContent value="duplicados" className="border rounded-lg p-6">
          <Duplicates />
        </TabsContent>

        <TabsContent value="cursos" className="border rounded-lg p-6">
          {/* Aquí podrías agregar un componente para la gestión de cursos, si lo tienes */}
          <div>Aquí iría la gestión de cursos</div>
        </TabsContent>

        <TabsContent value="configuracion" className="border rounded-lg p-6">
          <Settings />
          {/* Puedes agregar más componentes de configuración aquí */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
