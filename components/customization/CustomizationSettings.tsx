import React, { useState } from "react";
import { useCustomization } from "@/contexts/CustomizationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Upload, RotateCcw, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CustomizationSettings() {
  const { customization, loading, error, updateCustomization, uploadSidebarImage, uploadFavicon, uploadLogo, resetCustomization } =
    useCustomization();

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    organization_name: customization?.organization_name || "",
    primary_color: customization?.primary_color || "#3B82F6",
    secondary_color: customization?.secondary_color || "#A48644",
    accent_color: customization?.accent_color || "#EBDDB7",
    dark_mode_enabled: customization?.dark_mode_enabled || false,
    description: customization?.description || "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  const handleColorChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveColors = async () => {
    try {
      setIsSaving(true);
      setSuccessMessage("");
      await updateCustomization({
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        accent_color: formData.accent_color,
        dark_mode_enabled: formData.dark_mode_enabled,
        organization_name: formData.organization_name,
        description: formData.description,
      });
      setSuccessMessage("✓ Configuración guardada exitosamente");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error saving customization:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "sidebar" | "favicon" | "logo") => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);
      if (type === "sidebar") {
        await uploadSidebarImage(file);
        setSuccessMessage("✓ Imagen del sidebar cargada");
      } else if (type === "favicon") {
        await uploadFavicon(file);
        setSuccessMessage("✓ Favicon cargado");
      } else if (type === "logo") {
        await uploadLogo(file);
        setSuccessMessage("✓ Logo cargado");
      }
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm("¿Estás seguro? Esto restablecerá toda la configuración a los valores por defecto.")) {
      try {
        setIsSaving(true);
        await resetCustomization();
        setSuccessMessage("✓ Configuración restablecida a valores por defecto");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (error) {
        console.error("Error resetting customization:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors">Colores</TabsTrigger>
          <TabsTrigger value="images">Imágenes</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
        </TabsList>

        {/* TAB: COLORES */}
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>Personalización de Colores</CardTitle>
              <CardDescription>Ajusta los colores principales, secundarios y de acento del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Color Primario */}
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Color Primario</Label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        id="primary-color"
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => handleColorChange("primary_color", e.target.value)}
                        className="h-12 cursor-pointer"
                      />
                    </div>
                    <Input
                      type="text"
                      value={formData.primary_color}
                      onChange={(e) => handleColorChange("primary_color", e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                  <div
                    className="h-20 rounded border-2"
                    style={{ backgroundColor: formData.primary_color }}
                  />
                </div>

                {/* Color Secundario */}
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Color Secundario</Label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        id="secondary-color"
                        type="color"
                        value={formData.secondary_color}
                        onChange={(e) => handleColorChange("secondary_color", e.target.value)}
                        className="h-12 cursor-pointer"
                      />
                    </div>
                    <Input
                      type="text"
                      value={formData.secondary_color}
                      onChange={(e) => handleColorChange("secondary_color", e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                  <div
                    className="h-20 rounded border-2"
                    style={{ backgroundColor: formData.secondary_color }}
                  />
                </div>

                {/* Color de Acento */}
                <div className="space-y-2">
                  <Label htmlFor="accent-color">Color de Acento</Label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        id="accent-color"
                        type="color"
                        value={formData.accent_color}
                        onChange={(e) => handleColorChange("accent_color", e.target.value)}
                        className="h-12 cursor-pointer"
                      />
                    </div>
                    <Input
                      type="text"
                      value={formData.accent_color}
                      onChange={(e) => handleColorChange("accent_color", e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                  <div
                    className="h-20 rounded border-2"
                    style={{ backgroundColor: formData.accent_color }}
                  />
                </div>
              </div>

              {/* Dark Mode */}
              <div className="flex items-center space-x-2">
                <Input
                  id="dark-mode"
                  type="checkbox"
                  name="dark_mode_enabled"
                  checked={formData.dark_mode_enabled}
                  onChange={handleInputChange}
                  className="w-4 h-4"
                />
                <Label htmlFor="dark-mode" className="cursor-pointer">
                  Habilitar modo oscuro
                </Label>
              </div>

              <Button onClick={handleSaveColors} disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Colores"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: IMÁGENES */}
        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Imágenes</CardTitle>
              <CardDescription>Carga el logo, favicon e imagen del sidebar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div>
                <Label className="mb-2 block">Logo</Label>
                {customization?.logo_url && (
                  <div className="mb-4 p-4 bg-gray-100 rounded">
                    <img src={customization.logo_url} alt="Logo" className="h-16 object-contain" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => handleImageUpload(e, "logo")}
                    disabled={isSaving}
                    className="cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">Máx. 2MB</span>
                </div>
              </div>

              {/* Favicon */}
              <div>
                <Label className="mb-2 block">Favicon</Label>
                {customization?.favicon_url && (
                  <div className="mb-4 p-4 bg-gray-100 rounded">
                    <img src={customization.favicon_url} alt="Favicon" className="h-8 w-8" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/x-icon,image/gif,image/webp"
                    onChange={(e) => handleImageUpload(e, "favicon")}
                    disabled={isSaving}
                    className="cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">Máx. 1MB</span>
                </div>
              </div>

              {/* Sidebar Image */}
              <div>
                <Label className="mb-2 block">Imagen del Sidebar</Label>
                {customization?.sidebar_image_url && (
                  <div className="mb-4 p-4 bg-gray-100 rounded">
                    <img src={customization.sidebar_image_url} alt="Sidebar" className="h-32 w-full object-cover rounded" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => handleImageUpload(e, "sidebar")}
                    disabled={isSaving}
                    className="cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">Máx. 5MB</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: GENERAL */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>Información general del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="org-name">Nombre de la Organización</Label>
                <Input
                  id="org-name"
                  name="organization_name"
                  value={formData.organization_name}
                  onChange={handleInputChange}
                  placeholder="Gaia Business School"
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descripción del sistema..."
                  className="w-full min-h-24 p-2 border rounded-md"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveColors} disabled={isSaving} className="flex-1">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
                <Button onClick={handleReset} variant="outline" disabled={isSaving}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Resetear
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: VISTA PREVIA */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa</CardTitle>
              <CardDescription>Previsualización de los cambios</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-lg p-6 text-white space-y-4"
                style={{ backgroundColor: formData.primary_color }}
              >
                <h3 className="text-xl font-bold">Color Primario</h3>
                <p className="text-sm">{formData.primary_color}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div
                  className="rounded-lg p-6 text-white"
                  style={{ backgroundColor: formData.secondary_color }}
                >
                  <p className="text-sm font-semibold">Secundario</p>
                  <p className="text-xs">{formData.secondary_color}</p>
                </div>

                <div
                  className="rounded-lg p-6 text-black"
                  style={{ backgroundColor: formData.accent_color }}
                >
                  <p className="text-sm font-semibold">Acento</p>
                  <p className="text-xs">{formData.accent_color}</p>
                </div>
              </div>

              <div className="mt-4 p-4 rounded border-2" style={{ borderColor: formData.primary_color }}>
                <p className="text-sm">
                  <strong>Organización:</strong> {formData.organization_name}
                </p>
                <p className="text-sm mt-2">
                  <strong>Modo oscuro:</strong> {formData.dark_mode_enabled ? "Habilitado" : "Deshabilitado"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
