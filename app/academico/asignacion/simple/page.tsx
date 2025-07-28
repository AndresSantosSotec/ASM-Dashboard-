"use client"

import { useState, useEffect } from "react"
import type { Student } from "@/services/students"
import { fetchEnrolledStudents } from "@/services/students"
import StudentList from "@/components/views/student-list"

export default function AssignmentPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await fetchEnrolledStudents()
        const active = data.filter(
          (s: any) => s.is_active !== false && s.activo !== false && s.active !== false,
        )
        setStudents(active)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <StudentList students={students} />
      </div>
    </div>
  )
}
