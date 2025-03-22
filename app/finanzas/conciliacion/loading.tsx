import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-[600px]" />

        <div className="rounded-lg border p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>

          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>

          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    </div>
  )
}

