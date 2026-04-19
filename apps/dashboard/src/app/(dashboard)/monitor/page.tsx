import { Suspense } from "react"
import { cacheLife, cacheTag } from "next/cache"

import { MonitorStatusTable } from "@/features/monitor/components/monitor-status-table"
import { MonitorSummaryCards } from "@/features/monitor/components/monitor-summary-cards"
import { MonitorExecutionLogs } from "@/features/monitor/components/monitor-execution-logs"

import { getDb } from "@/lib/db"
import { Skeleton } from "@viral-scout/ui/components/skeleton"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { getJobHealthSummary, getRecentLogsForSource, getAllSources } from "@viral-scout/database"

export const metadata = {
  title: "Monitor"
}

const MonitorPage = () => {
  return (
    <div className="flex flex-col h-full bg-background">
      <DashboardHeader title="Source Monitor" description="System Health & Scrapers" />

      <Suspense
        fallback={
          <div className="px-8 py-8 max-w-7xl mx-auto w-full space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        }
      >
        <MonitorContent />
      </Suspense>
    </div>
  )
}

export default MonitorPage

export const MonitorContent = async () => {
  "use cache"
  cacheLife("minutes")
  cacheTag("monitor-status")

  const db = await getDb()
  const [sources, healthSummary] = await Promise.all([getAllSources(db), getJobHealthSummary(db)])

  const recentLogsPerSource = await Promise.all(
    sources
      .filter((s) => s.isActive)
      .map(async (s) => ({
        source: s,
        logs: await getRecentLogsForSource(db, s.id, 5)
      }))
  )

  const healthMap = new Map(healthSummary.map((h) => [h.sourceId, h]))
  const totalActive = sources.filter((s) => s.isActive).length
  const totalFailed = healthSummary.filter((h) => h.lastStatus === "failed").length
  const totalAnalyzed = healthSummary.reduce((sum, h) => sum + (h.totalAnalyzed ?? 0), 0)

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-8 py-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Page title */}
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight">System Health</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Operational status of scrapers and AI analyzers
          </p>
        </div>

        {/* Summary metrics */}
        <MonitorSummaryCards
          totalActive={totalActive}
          totalSources={sources.length}
          totalFailed={totalFailed}
          totalAnalyzed={totalAnalyzed}
        />

        {/* Source status table */}
        <MonitorStatusTable sources={sources} healthMap={healthMap} />

        {/* Execution logs */}
        <MonitorExecutionLogs recentLogsPerSource={recentLogsPerSource} />
      </div>
    </div>
  )
}
