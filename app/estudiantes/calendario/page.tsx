import type { Metadata } from "next"
import CalendarView from "@/components/estudiantes/calendar-view"

export const metadata: Metadata = {
  title: "Calendario Académico | Portal Estudiantil",
  description: "Visualiza tus eventos académicos y examenes programados",
}

export default function CalendarioPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Calendario Académico</h1>
      <CalendarView />
    </div>
  )
}

