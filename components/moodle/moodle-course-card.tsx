"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BookOpen } from "lucide-react"
import type { MoodleCourse } from "@/services/moodle"

interface Props {
  course: MoodleCourse
}

export default function MoodleCourseCard({ course }: Props) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-lg">{course.fullname}</h3>
        </div>
        <div className="text-sm text-gray-600">{course.shortname}</div>
      </CardContent>
    </Card>
  )
}
