import { useCustomization } from "@/contexts/CustomizationContext";

// Colores Gaia hardcodeados: primario azul, secundario rojo, acento blanco (sin custom)
const GAIA_COLORS = {
  primary: "#0E2B49",   // azul navy
  secondary: "#7E162B", // rojo wine
  accent: "#FFFFFF",    // blanco
};

/**
 * Hook para obtener los colores del sistema.
 * Siempre devuelve el branding Gaia; la personalización de colores está desactivada.
 */
export function useSystemColors() {
  const { customization } = useCustomization();

  return {
    primary: GAIA_COLORS.primary,
    secondary: GAIA_COLORS.secondary,
    accent: GAIA_COLORS.accent,
    isDarkMode: customization?.dark_mode_enabled || false,
    sidebarImage: customization?.sidebar_image_url,
    favicon: customization?.favicon_url,
    logo: customization?.logo_url,
    organizationName: customization?.organization_name || "Gaia Business School",
  };
}

/**
 * Hook para obtener estilos inline con colores Gaia (tema predefinido)
 */
export function useCustomizationStyles() {
  const { customization } = useCustomization();

  return {
    primaryBg: { backgroundColor: GAIA_COLORS.primary },
    primaryText: { color: GAIA_COLORS.primary },
    secondaryBg: { backgroundColor: GAIA_COLORS.secondary },
    secondaryText: { color: GAIA_COLORS.primary },
    accentBg: { backgroundColor: GAIA_COLORS.accent },
    accentText: { color: GAIA_COLORS.accent },
    sidebarBg: customization?.sidebar_image_url
      ? { backgroundImage: `url(${customization.sidebar_image_url})`, backgroundSize: "cover" }
      : { backgroundColor: GAIA_COLORS.primary },
  };
}
