import type { Metadata } from "next"
import { DocumentsView } from "@/components/estudiantes/documents-view"

export const metadata: Metadata = {
  title: "Documentos Estudiantiles",
  description: "Solicitud y gestión de documentos académicos",
}

export default function DocumentsPage() {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">Documentos Estudiantiles</h1>
      <DocumentsView />
    </div>
  )
}

