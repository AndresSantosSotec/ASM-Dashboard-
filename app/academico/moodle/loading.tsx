import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

function CourseCardSkeleton() {
  return (
    <Card className="border-muted">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardFooter>
        <Skeleton className="h-8 w-32" />
      </CardFooter>
    </Card>
  )
}

function MonthGroupSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-8" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CourseCardSkeleton />
        <CourseCardSkeleton />
        <CourseCardSkeleton />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-2" />
        <Skeleton className="h-4 w-28" />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4">
          {/* Título */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center flex-wrap">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-40" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-9 w-44" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <MonthGroupSkeleton />
          <MonthGroupSkeleton />
          <MonthGroupSkeleton />
        </CardContent>

        {/* Paginación */}
        <CardFooter className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
