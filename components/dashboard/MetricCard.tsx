"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, Minus, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  variation?: number | null
  icon?: LucideIcon
  prefix?: string
  suffix?: string
  description?: string
  loading?: boolean
  className?: string
  valueClassName?: string
  trend?: "up" | "down" | "neutral"
}

export default function MetricCard({
  title,
  value,
  variation,
  icon: Icon,
  prefix = "",
  suffix = "",
  description,
  loading = false,
  className,
  valueClassName,
  trend,
}: MetricCardProps) {
  // Determinar tendencia automáticamente si no se especifica
  const finalTrend = trend ?? (variation ? (variation > 0 ? "up" : variation < 0 ? "down" : "neutral") : "neutral")

  const formatValue = (val: string | number): string => {
    if (typeof val === "number") {
      // Si es un número grande, formatearlo con comas
      if (val >= 1000) {
        return val.toLocaleString("es-GT", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      }
      return val.toFixed(2)
    }
    return val.toString()
  }

  const getTrendIcon = () => {
    switch (finalTrend) {
      case "up":
        return <ArrowUp className="h-4 w-4" />
      case "down":
        return <ArrowDown className="h-4 w-4" />
      default:
        return <Minus className="h-4 w-4" />
    }
  }

  const getTrendColor = () => {
    switch (finalTrend) {
      case "up":
        return "text-green-600 bg-green-50 border-green-200"
      case "down":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && (
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
            {variation !== undefined && <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />}
          </div>
        ) : (
          <>
            <div className={cn("text-2xl font-bold", valueClassName)}>
              {prefix}
              {formatValue(value)}
              {suffix}
            </div>

            <div className="flex items-center gap-2 mt-2">
              {variation !== undefined && variation !== null && (
                <Badge variant="outline" className={cn("gap-1 px-2 py-0.5", getTrendColor())}>
                  {getTrendIcon()}
                  <span className="text-xs font-medium">{Math.abs(variation).toFixed(1)}%</span>
                </Badge>
              )}
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
