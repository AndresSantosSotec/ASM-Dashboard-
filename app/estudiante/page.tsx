import type { Metadata } from "next"
import EstudianteDashboardClient from "./estudiante-dashboard-client"

export const metadata: Metadata = {
  title: "Dashboard Estudiantil | Blue Atlas",
  description: "Panel de control para estudiantes de Blue Atlas",
}

export default function EstudianteDashboardPage() {
  return <EstudianteDashboardClient />
}

