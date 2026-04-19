import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircle, Activity, Zap } from "@hugeicons/core-free-icons"

import { cn } from "@viral-scout/ui/lib/utils"
import { Card, CardContent } from "@viral-scout/ui/components/card"

export interface Props {
  totalActive: number
  totalSources: number
  totalFailed: number
  totalAnalyzed: number
}

export const MonitorSummaryCards = ({ totalActive, totalSources, totalFailed, totalAnalyzed }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-none shadow-sm bg-muted/30">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-2.5 bg-success/10 text-success rounded-lg shrink-0">
            <HugeiconsIcon icon={Activity} className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Active Sources
            </p>
            <p className="text-2xl font-bold font-display tabular-nums mt-0.5">
              {totalActive}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / {totalSources}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-muted/30">
        <CardContent className="p-5 flex items-center gap-4">
          <div
            className={cn(
              "p-2.5 rounded-lg shrink-0",
              totalFailed > 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
            )}
          >
            <HugeiconsIcon icon={AlertCircle} className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Recent Failures
            </p>
            <p
              className={cn(
                "text-2xl font-bold font-display tabular-nums mt-0.5",
                totalFailed > 0 && "text-destructive"
              )}
            >
              {totalFailed}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-muted/30">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-2.5 bg-primary/10 text-primary rounded-lg shrink-0">
            <HugeiconsIcon icon={Zap} className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Total Analyzed
            </p>
            <p className="text-2xl font-bold font-display tabular-nums mt-0.5">
              {totalAnalyzed.toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
