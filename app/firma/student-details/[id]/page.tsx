"use client"

import { Header } from "@/components/header"
import { StudentDetails } from "@/components/firma/student-details"

export default function StudentDetailsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Detalles del Estudiante" />
      <main className="flex-1 p-4 md:p-6">
        <StudentDetails />
      </main>
    </div>
  )
}

