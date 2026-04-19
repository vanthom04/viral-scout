import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@viral-scout/ui/lib/utils"
import { Badge } from "@viral-scout/ui/components/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from "@viral-scout/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader
} from "@viral-scout/ui/components/table"

import { STATUS_CONFIG, formatRelativeTime } from "../utils"

export interface Props {
  sources: {
    id: string
    name: string
    platform: string
    isActive: boolean
  }[]
  healthMap: Map<string, {
    lastStatus: string | null
    lastRunAt: string | null
    totalScraped: number | null
    totalAnalyzed: number | null
  }>
}

export const MonitorStatusTable = ({ sources, healthMap }: Props) => {
  return (
    <Card className="border-none shadow-sm overflow-hidden gap-0">
      <CardHeader className="px-6 py-4 border-b border-border/50 bg-muted/20">
        <CardTitle className="text-sm font-semibold font-display">Source Status</CardTitle>
        <CardDescription className="text-xs">
          Connection and data collection status — updated after each cron run
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Source
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Platform
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Last Run
              </TableHead>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Scraped
              </TableHead>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Analyzed
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => {
              const health = healthMap.get(source.id)
              const status = (health?.lastStatus ?? "failed") as keyof typeof STATUS_CONFIG
              const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.failed
              const StatusIcon = config.icon

              return (
                <TableRow
                  key={source.id}
                  className={cn(
                    "border-border/30 transition-colors",
                    !source.isActive ? "opacity-40" : "hover:bg-muted/20"
                  )}
                >
                  <TableCell className="py-3.5 font-medium text-sm">{source.name}</TableCell>
                  <TableCell className="py-3.5">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-semibold uppercase tracking-wide rounded-md px-1.5"
                    >
                      {source.platform}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3.5">
                    {health ? (
                      <Badge
                        className={cn(
                          "text-[10px] font-semibold gap-1 rounded-md px-1.5",
                          config.badgeClass
                        )}
                      >
                        <HugeiconsIcon icon={StatusIcon} className="size-3" />
                        {config.label}
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-muted-foreground font-medium">Pending</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3.5 text-xs text-muted-foreground font-medium">
                    {health?.lastRunAt ? formatRelativeTime(health.lastRunAt) : "—"}
                  </TableCell>
                  <TableCell className="py-3.5 text-right tabular-nums text-sm font-semibold">
                    {health?.totalScraped ?? "—"}
                  </TableCell>
                  <TableCell className="py-3.5 text-right tabular-nums text-sm font-semibold text-primary">
                    {health?.totalAnalyzed ?? "—"}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
