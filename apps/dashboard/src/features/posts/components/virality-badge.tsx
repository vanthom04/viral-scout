import { Flame, TrendingUp, Minus } from "@hugeicons/core-free-icons"

import { cn } from "@viral-scout/ui/lib/utils"
import { Badge } from "@viral-scout/ui/components/badge"

const getViralityConfig = (score: number) => {
  if (score >= 8.5) {
    return {
      label: `🔥 ${score.toFixed(1)}`,
      className:
        "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800",
      icon: Flame
    }
  }

  if (score >= 7) {
    return {
      label: `⚡ ${score.toFixed(1)}`,
      className:
        "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800",
      icon: TrendingUp
    }
  }

  return {
    label: `${score.toFixed(1)}`,
    className: "bg-muted text-muted-foreground",
    icon: Minus
  }
}

interface ViralityBadgeProps {
  score: number
  className?: string
}

export const ViralityBadge = ({ score, className }: ViralityBadgeProps) => {
  const config = getViralityConfig(score)

  return (
    <Badge
      variant="outline"
      className={cn("font-semibold tabular-nums", config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
