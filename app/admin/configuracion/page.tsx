import type { Metadata } from "next"
import ConfiguracionClient from "./configuracion-client"

export const metadata: Metadata = {
  title: "Configuración | Blue Atlas",
  description: "Panel de configuración general del sistema",
}

export default function ConfiguracionPage() {
  return <ConfiguracionClient />
}

