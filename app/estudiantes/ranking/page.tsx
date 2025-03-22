import type { Metadata } from "next"
import { RankingView } from "@/components/estudiantes/ranking-view"

export const metadata: Metadata = {
  title: "Ranking Estudiantil",
  description: "Consulta tu posición y calificaciones en cada curso",
}

export default function RankingPage() {
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">Ranking Estudiantil</h1>
      <RankingView />
    </div>
  )
}

