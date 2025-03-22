import type { Metadata } from "next"
import NotificationsView from "@/components/estudiantes/notifications-view"

export const metadata: Metadata = {
  title: "Notificaciones | Portal Estudiantil",
  description: "Centro de notificaciones y alertas importantes",
}

export default function NotificacionesPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Centro de Notificaciones</h1>
      <NotificationsView />
    </div>
  )
}

