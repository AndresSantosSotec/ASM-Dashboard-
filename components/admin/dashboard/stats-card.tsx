import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string
  icon: LucideIcon
  subtitle?: string
  description?: string
  tone?: "success" | "danger" | "muted"
  iconClassName?: string
  className?: string
}

const toneClasses: Record<NonNullable<StatsCardProps["tone"]>, string> = {
  success: "text-emerald-600",
  danger: "text-rose-600",
  muted: "text-muted-foreground",
}

export function StatsCard({
  title,
  value,
  subtitle,
  description,
  icon: Icon,
  tone = "muted",
  iconClassName,
  className,
}: StatsCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold leading-tight">{value}</h3>
            {subtitle ? (
              <p className={cn("text-xs font-medium", toneClasses[tone])}>{subtitle}</p>
            ) : null}
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <div className="shrink-0 rounded-full bg-muted p-3">
            <Icon className={cn("h-6 w-6 text-primary", iconClassName)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
