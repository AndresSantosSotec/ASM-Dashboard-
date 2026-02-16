"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/services/api";

interface CustomizationData {
  id: number;
  organization_name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string | null;
  sidebar_image_url: string | null;
  favicon_url: string | null;
  dark_mode_enabled: boolean;
  custom_css: Record<string, any> | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomizationContextType {
  customization: CustomizationData | null;
  loading: boolean;
  error: string | null;
  updateCustomization: (data: Partial<CustomizationData>) => Promise<CustomizationData>;
  uploadSidebarImage: (file: File) => Promise<string>;
  uploadFavicon: (file: File) => Promise<string>;
  uploadLogo: (file: File) => Promise<string>;
  resetCustomization: () => Promise<void>;
  refreshCustomization: () => Promise<void>;
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

export function CustomizationProvider({ children }: { children: ReactNode }) {
  const [customization, setCustomization] = useState<CustomizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar configuración inicial
  const loadCustomization = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{ success: boolean; data: CustomizationData }>("/customization/current");
      setCustomization(response.data.data);
      applyCustomizationStyles(response.data.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar personalización";
      setError(message);
      console.error("Error loading customization:", err);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar estilos de personalización al DOM
  const applyCustomizationStyles = (data: CustomizationData) => {
    const root = document.documentElement;

    // Setear colores como CSS variables
    root.style.setProperty("--primary-color", data.primary_color);
    root.style.setProperty("--secondary-color", data.secondary_color);
    root.style.setProperty("--accent-color", data.accent_color);

    // Setear favicon
    if (data.favicon_url) {
      updateFaviconInDOM(data.favicon_url);
    }

    // Setear dark mode
    if (data.dark_mode_enabled) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Aplicar CSS personalizado
    if (data.custom_css) {
      applyCustomCSS(data.custom_css);
    }

    // Guardar en localStorage para acceso rápido
    localStorage.setItem("customization", JSON.stringify(data));
  };

  const updateFaviconInDOM = (url: string) => {
    let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.href = url;
  };

  const applyCustomCSS = (customCss: Record<string, any>) => {
    let style = document.getElementById("custom-styles") as HTMLStyleElement;
    if (!style) {
      style = document.createElement("style");
      style.id = "custom-styles";
      document.head.appendChild(style);
    }

    let cssString = "";
    Object.entries(customCss).forEach(([selector, rules]) => {
      const ruleString = Object.entries(rules)
        .map(([prop, value]) => `${prop}: ${value};`)
        .join("\n  ");
      cssString += `${selector} {\n  ${ruleString}\n}\n`;
    });

    style.textContent = cssString;
  };

  const updateCustomization = async (data: Partial<CustomizationData>) => {
    try {
      setLoading(true);
      const response = await api.post<{ success: boolean; data: CustomizationData }>("/customization/update", data);
      setCustomization(response.data.data);
      applyCustomizationStyles(response.data.data);
      return response.data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al actualizar personalización";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadSidebarImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post<{ success: boolean; data: { sidebar_image_url: string; customization: CustomizationData } }>(
      "/customization/sidebar-image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const updatedCustomization = response.data.data.customization;
    setCustomization(updatedCustomization);
    applyCustomizationStyles(updatedCustomization);

    return response.data.data.sidebar_image_url;
  };

  const uploadFavicon = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("favicon", file);

    const response = await api.post<{ success: boolean; data: { favicon_url: string; customization: CustomizationData } }>(
      "/customization/favicon",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const updatedCustomization = response.data.data.customization;
    setCustomization(updatedCustomization);
    applyCustomizationStyles(updatedCustomization);

    return response.data.data.favicon_url;
  };

  const uploadLogo = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("logo", file);

    const response = await api.post<{ success: boolean; data: { logo_url: string; customization: CustomizationData } }>(
      "/customization/logo",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const updatedCustomization = response.data.data.customization;
    setCustomization(updatedCustomization);
    applyCustomizationStyles(updatedCustomization);

    return response.data.data.logo_url;
  };

  const resetCustomization = async () => {
    try {
      setLoading(true);
      await api.post("/customization/reset");
      await loadCustomization();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al resetear personalización";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshCustomization = async () => {
    await loadCustomization();
  };

  // Cargar personalización en el mount
  useEffect(() => {
    loadCustomization();
  }, []);

  return (
    <CustomizationContext.Provider
      value={{
        customization,
        loading,
        error,
        updateCustomization,
        uploadSidebarImage,
        uploadFavicon,
        uploadLogo,
        resetCustomization,
        refreshCustomization,
      }}
    >
      {children}
    </CustomizationContext.Provider>
  );
}

export function useCustomization() {
  const context = useContext(CustomizationContext);
  if (!context) {
    throw new Error("useCustomization debe ser usado dentro de CustomizationProvider");
  }
  return context;
}
