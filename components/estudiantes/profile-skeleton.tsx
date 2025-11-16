import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="relative pb-0">
          {/* Header Background */}
          <div className="bg-blue-50 absolute top-0 left-0 right-0 h-32 rounded-t-lg"></div>
          
          {/* Avatar and Info */}
          <div className="relative flex flex-col sm:flex-row items-center">
            <div className="relative mb-4 sm:mb-0">
              <Skeleton className="w-24 h-24 rounded-full" />
            </div>
            <div className="text-center sm:text-left sm:ml-6 flex-1">
              <Skeleton className="h-8 w-64 mb-2" />
              <div className="flex flex-wrap gap-2 mt-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-36" />
              </div>
            </div>
            <Skeleton className="h-10 w-32 mt-4 sm:mt-0" />
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {/* Tabs Skeleton */}
          <div className="mb-6">
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-48" />
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="space-y-6">
            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mt-6 space-y-2">
              <Skeleton className="h-4 w-40" />
              <div className="flex justify-between mb-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
