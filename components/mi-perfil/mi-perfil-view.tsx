"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Loader2, User, Shield, Key, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import miPerfilService, { type UserProfile } from "@/services/mi-perfil"

export default function MiPerfilView() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "info"

  // Estado del perfil
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Estado para edición de nombre
  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
  })

  // Estado para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    contrasena_actual: "",
    contrasena_nueva: "",
    contrasena_nueva_confirmation: "",
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    actual: false,
    nueva: false,
    confirmar: false,
  })

  // Cargar perfil al montar
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await miPerfilService.getMiPerfil()
      setProfile(data)
      setEditData({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar el perfil",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      setSaving(true)
      const updated = await miPerfilService.actualizarPerfil(editData)
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              first_name: updated.first_name,
              last_name: updated.last_name,
              full_name: updated.full_name,
            }
          : prev
      )
      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido actualizada correctamente",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    // Validaciones del cliente
    if (
      !passwordData.contrasena_actual ||
      !passwordData.contrasena_nueva ||
      !passwordData.contrasena_nueva_confirmation
    ) {
      toast({
        title: "Campos requeridos",
        description: "Todos los campos de contraseña son obligatorios",
        variant: "destructive",
      })
      return
    }

    if (passwordData.contrasena_nueva.length < 8) {
      toast({
        title: "Contraseña muy corta",
        description: "La nueva contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      })
      return
    }

    if (passwordData.contrasena_nueva !== passwordData.contrasena_nueva_confirmation) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      return
    }

    if (passwordData.contrasena_actual === passwordData.contrasena_nueva) {
      toast({
        title: "Error",
        description: "La nueva contraseña debe ser diferente a la actual",
        variant: "destructive",
      })
      return
    }

    try {
      setChangingPassword(true)
      await miPerfilService.cambiarContrasena(passwordData)
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente",
      })
      // Limpiar formulario
      setPasswordData({
        contrasena_actual: "",
        contrasena_nueva: "",
        contrasena_nueva_confirmation: "",
      })
      setShowPasswords({ actual: false, nueva: false, confirmar: false })
    } catch (error: any) {
      toast({
        title: "Error al cambiar contraseña",
        description: error.message || "No se pudo cambiar la contraseña",
        variant: "destructive",
      })
    } finally {
      setChangingPassword(false)
    }
  }

  // Esqueleto de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-asm-medium-gold" />
          <p className="text-sm text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-muted-foreground">No se pudo cargar el perfil</p>
            <Button variant="outline" className="mt-4" onClick={loadProfile}>
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calcular seguridad de contraseña
  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    if (strength <= 1) return { label: "Débil", color: "bg-red-500", value: 20 }
    if (strength <= 2) return { label: "Regular", color: "bg-orange-500", value: 40 }
    if (strength <= 3) return { label: "Buena", color: "bg-yellow-500", value: 60 }
    if (strength <= 4) return { label: "Fuerte", color: "bg-green-500", value: 80 }
    return { label: "Muy fuerte", color: "bg-emerald-600", value: 100 }
  }

  const passwordStrength = getPasswordStrength(passwordData.contrasena_nueva)

  return (
    <div className="space-y-6">
      {/* Cabecera del perfil */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-asm-navy flex items-center justify-center">
              <User className="h-8 w-8 text-asm-light-gold" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{profile.full_name || profile.username}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-asm-navy/10 text-asm-navy">
                  {profile.rol || "Sin rol"}
                </Badge>
                <Badge
                  variant={profile.is_active ? "default" : "destructive"}
                  className={profile.is_active ? "bg-green-100 text-green-800" : ""}
                >
                  {profile.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{profile.email}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info" className="gap-2">
            <User className="h-4 w-4" />
            Información Personal
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
        </TabsList>

        {/* Tab Información Personal */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos de la Cuenta</CardTitle>
              <CardDescription>
                Información general de tu cuenta en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nombre</Label>
                  <Input
                    id="first_name"
                    value={editData.first_name}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, first_name: e.target.value }))
                    }
                    placeholder="Tu nombre"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Apellido</Label>
                  <Input
                    id="last_name"
                    value={editData.last_name}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, last_name: e.target.value }))
                    }
                    placeholder="Tu apellido"
                    disabled={saving}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Usuario</Label>
                  <Input value={profile.username} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Correo electrónico</Label>
                  <Input value={profile.email} disabled className="bg-muted" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Rol</Label>
                  <Input value={profile.rol || "Sin rol"} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Último acceso</Label>
                  <Input
                    value={
                      profile.last_login
                        ? new Date(profile.last_login).toLocaleString("es-GT")
                        : "Sin registros"
                    }
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Fecha de creación</Label>
                  <Input
                    value={
                      profile.created_at
                        ? new Date(profile.created_at).toLocaleDateString("es-GT")
                        : "—"
                    }
                    disabled
                    className="bg-muted"
                  />
                </div>

              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpdateProfile} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab Seguridad */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* Cambio de contraseña */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-asm-medium-gold" />
                  <div>
                    <CardTitle className="text-base">Cambiar Contraseña</CardTitle>
                    <CardDescription>
                      Actualiza tu contraseña periódicamente para mantener tu cuenta segura.
                      La nueva contraseña debe tener al menos 8 caracteres.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contraseña actual */}
                <div className="space-y-2">
                  <Label htmlFor="current-password">Contraseña Actual</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPasswords.actual ? "text" : "password"}
                      value={passwordData.contrasena_actual}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          contrasena_actual: e.target.value,
                        }))
                      }
                      placeholder="Ingresa tu contraseña actual"
                      disabled={changingPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() =>
                        setShowPasswords((prev) => ({ ...prev, actual: !prev.actual }))
                      }
                    >
                      {showPasswords.actual ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Nueva contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPasswords.nueva ? "text" : "password"}
                      value={passwordData.contrasena_nueva}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          contrasena_nueva: e.target.value,
                        }))
                      }
                      placeholder="Mínimo 8 caracteres"
                      disabled={changingPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() =>
                        setShowPasswords((prev) => ({ ...prev, nueva: !prev.nueva }))
                      }
                    >
                      {showPasswords.nueva ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>

                  {/* Indicador de fortaleza */}
                  {passwordData.contrasena_nueva && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Fortaleza de la contraseña
                        </span>
                        <span className="text-xs font-medium">{passwordStrength.label}</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all duration-300 rounded-full`}
                          style={{ width: `${passwordStrength.value}%` }}
                        />
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
                        <li className={passwordData.contrasena_nueva.length >= 8 ? "text-green-600" : ""}>
                          {passwordData.contrasena_nueva.length >= 8 ? "✓" : "○"} Al menos 8 caracteres
                        </li>
                        <li className={/[A-Z]/.test(passwordData.contrasena_nueva) ? "text-green-600" : ""}>
                          {/[A-Z]/.test(passwordData.contrasena_nueva) ? "✓" : "○"} Una letra mayúscula
                        </li>
                        <li className={/[0-9]/.test(passwordData.contrasena_nueva) ? "text-green-600" : ""}>
                          {/[0-9]/.test(passwordData.contrasena_nueva) ? "✓" : "○"} Un número
                        </li>
                        <li className={/[^A-Za-z0-9]/.test(passwordData.contrasena_nueva) ? "text-green-600" : ""}>
                          {/[^A-Za-z0-9]/.test(passwordData.contrasena_nueva) ? "✓" : "○"} Un carácter especial
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Confirmar contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPasswords.confirmar ? "text" : "password"}
                      value={passwordData.contrasena_nueva_confirmation}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          contrasena_nueva_confirmation: e.target.value,
                        }))
                      }
                      placeholder="Repite la nueva contraseña"
                      disabled={changingPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          confirmar: !prev.confirmar,
                        }))
                      }
                    >
                      {showPasswords.confirmar ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>

                  {/* Indicador de coincidencia */}
                  {passwordData.contrasena_nueva_confirmation && (
                    <div className="flex items-center gap-1 text-xs">
                      {passwordData.contrasena_nueva ===
                      passwordData.contrasena_nueva_confirmation ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-green-600">Las contraseñas coinciden</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                          <span className="text-red-500">Las contraseñas no coinciden</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                  className="bg-asm-navy hover:bg-asm-navy/90"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Actualizando contraseña...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Actualizar Contraseña
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Info de sesión */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sesión Activa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Sesión activa</p>
                    <p className="text-xs text-muted-foreground">
                      {profile.last_login
                        ? `Desde ${new Date(profile.last_login).toLocaleDateString("es-GT")}`
                        : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
