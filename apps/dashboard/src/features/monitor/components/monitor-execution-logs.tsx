import { HugeiconsIcon } from "@hugeicons/react"
import { Activity } from "@hugeicons/core-free-icons"

import { cn } from "@viral-scout/ui/lib/utils"
import { Badge } from "@viral-scout/ui/components/badge"
import { Separator } from "@viral-scout/ui/components/separator"
import { Card, CardContent } from "@viral-scout/ui/components/card"
import { Table, TableBody, TableCell, TableRow } from "@viral-scout/ui/components/table"

import { STATUS_CONFIG, formatRelativeTime, formatDuration } from "../utils"

export interface Props {
  recentLogsPerSource: {
    source: {
      id: string
      name: string
      cronSchedule: string | null
    }
    logs: {
      id: string
      status: string
      runAt: string
      postsScraped: number | null
      postsAnalyzed: number | null
      durationMs: number
      errorMessage: string | null
    }[]
  }[]
}

export const MonitorExecutionLogs = ({ recentLogsPerSource }: Props) => {
  if (!recentLogsPerSource.some(({ logs }) => logs.length > 0)) {
    return null
  }

  return (
    <div className="space-y-4">
      <Separator className="border-border/40" />
      <h3 className="text-sm font-semibold font-display flex items-center gap-2">
        <HugeiconsIcon icon={Activity} className="size-4 text-muted-foreground" />
        Execution Logs
      </h3>
      <div className="grid gap-4">
        {recentLogsPerSource.map(({ source, logs }) => {
          if (logs.length === 0) return null
          return (
            <Card key={source.id} className="border-none shadow-sm bg-muted/30 overflow-hidden">
              <div className="px-5 py-3 border-b border-border/40 flex items-center gap-3">
                <span className="text-xs font-semibold">{source.name}</span>
                <Separator orientation="vertical" className="h-3" />
                <span className="text-[10px] text-muted-foreground font-mono">
                  {source.cronSchedule}
                </span>
              </div>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {logs.map((log) => {
                      const logStatus = log.status as keyof typeof STATUS_CONFIG
                      const config = STATUS_CONFIG[logStatus] ?? STATUS_CONFIG.failed
                      const LogIcon = config.icon

                      return (
                        <TableRow
                          key={log.id}
                          className="border-border/20 hover:bg-background/40 transition-colors"
                        >
                          <TableCell className="py-2.5 text-[11px] text-muted-foreground font-medium w-32">
                            {formatRelativeTime(log.runAt)}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Badge
                              className={cn(
                                "text-[10px] font-semibold gap-1 rounded-md px-1.5",
                                config.badgeClass
                              )}
                            >
                              <HugeiconsIcon icon={LogIcon} className="size-3" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5 text-[11px] tabular-nums font-medium">
                            <span className="text-muted-foreground">S:</span> {log.postsScraped}{" "}
                            <span className="text-muted-foreground ml-1">A:</span>{" "}
                            {log.postsAnalyzed}
                          </TableCell>
                          <TableCell className="py-2.5 text-right text-[11px] text-muted-foreground font-mono">
                            {formatDuration(log.durationMs)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {logs[0]?.errorMessage && (
                  <div className="px-5 py-2.5 bg-destructive/5 border-t border-destructive/10">
                    <p className="text-[11px] text-destructive font-mono truncate">
                      ⚠ {logs[0].errorMessage}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
