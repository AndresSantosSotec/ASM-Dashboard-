"use client"

import { useEffect, useState } from "react"
import { fetchMoodleCourses, MoodleCourse } from "@/services/moodle"
import MoodleCourseCard from "@/components/moodle/moodle-course-card"

export default function MoodleCoursesClient() {
  const [courses, setCourses] = useState<MoodleCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchMoodleCourses()
        setCourses(data)
      } catch (err) {
        console.error("Error fetching Moodle courses", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <div>Cargando cursos...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {courses.map(course => (
        <MoodleCourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}
