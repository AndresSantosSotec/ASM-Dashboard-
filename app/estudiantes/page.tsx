import { StudentDashboard } from "@/components/estudiantes/student-dashboard"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard Estudiantil",
  description: "Portal de estudiantes con información académica y financiera",
}

export default function EstudiantesPage() {
  return <StudentDashboard />
}

