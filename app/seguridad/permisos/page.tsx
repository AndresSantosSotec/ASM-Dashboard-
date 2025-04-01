import type { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PermisosUsuariosTab from "@/components/permisos/permisos-usuarios-tab"
import PermisosRolesTab from "@/components/permisos/permisos-roles-tab"
import PermisosModulosTab from "@/components/permisos/permisos-modulos-tab"
import PermisosVistasTab from "@/components/permisos/permisos-vistas-tab"

export const metadata: Metadata = {
  title: "Administración de Permisos | Blue Atlas Dashboard",
  description: "Gestión de permisos y accesos al sistema",
}

export default function PermisosPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administración de Permisos</h1>
          <p className="text-muted-foreground">Gestiona los permisos y accesos de usuarios al sistema</p>
        </div>
      </div>

      <Tabs defaultValue="usuarios" className="w-full">
        {/* Cambia grid-cols-3 por grid-cols-4 para 4 pestañas */}
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="modulos">Módulos y Vistas</TabsTrigger>
          <TabsTrigger value="asignacion">Asignación de Permisos</TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios" className="py-4">
          <PermisosUsuariosTab />
        </TabsContent>
        <TabsContent value="roles" className="py-4">
          <PermisosRolesTab />
        </TabsContent>
        <TabsContent value="modulos" className="py-4">
          <PermisosModulosTab />
        </TabsContent>
        <TabsContent value="asignacion" className="py-4">
          <PermisosVistasTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
