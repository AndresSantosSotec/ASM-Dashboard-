import type { Metadata } from "next"
import MoodleCoursesClient from "./moodle-courses-client"

export const metadata: Metadata = {
  title: "Cursos Moodle",
  description: "Listado de cursos obtenidos de Moodle",
}

export default function MoodleCoursesPage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-4">Cursos en Moodle</h1>
      <MoodleCoursesClient />
    </div>
  )
}
