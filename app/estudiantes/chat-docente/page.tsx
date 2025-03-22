import type { Metadata } from "next"
import ChatDocente from "@/components/estudiantes/chat-docente"

export const metadata: Metadata = {
  title: "Chat Docente | Portal Estudiantil",
  description: "Interactúa con tus docentes en tiempo real.",
}

export default function ChatDocentePage() {
  return (
    <div className="container mx-auto py-6">
      <ChatDocente />
    </div>
  )
}