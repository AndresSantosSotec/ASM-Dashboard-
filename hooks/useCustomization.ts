import { useCustomization } from "@/contexts/CustomizationContext";

/**
 * Hook para obtener los colores de personalización del sistema
 * Devuelve objeto con colores listos para usar en componentes
 */
export function useSystemColors() {
  const { customization } = useCustomization();

  return {
    primary: customization?.primary_color || "#3B82F6",
    secondary: customization?.secondary_color || "#A48644",
    accent: customization?.accent_color || "#EBDDB7",
    isDarkMode: customization?.dark_mode_enabled || false,
    sidebarImage: customization?.sidebar_image_url,
    favicon: customization?.favicon_url,
    logo: customization?.logo_url,
    organizationName: customization?.organization_name || "Gaia Business School",
  };
}

/**
 * Hook para obtener estilos inline basados en personalización
 */
export function useCustomizationStyles() {
  const { customization } = useCustomization();

  return {
    primaryBg: { backgroundColor: customization?.primary_color },
    primaryText: { color: customization?.primary_color },
    secondaryBg: { backgroundColor: customization?.secondary_color },
    secondaryText: { color: customization?.secondary_color },
    accentBg: { backgroundColor: customization?.accent_color },
    accentText: { color: customization?.accent_color },
    sidebarBg: customization?.sidebar_image_url
      ? { backgroundImage: `url(${customization.sidebar_image_url})`, backgroundSize: "cover" }
      : { backgroundColor: customization?.primary_color },
  };
}
