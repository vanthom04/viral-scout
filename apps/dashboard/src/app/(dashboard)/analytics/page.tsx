import { Suspense } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { TrendingUp } from "@hugeicons/core-free-icons"

import { fetchAnalyticsData } from "@/features/analytics/queries"

import { Badge } from "@viral-scout/ui/components/badge"
import { Skeleton } from "@viral-scout/ui/components/skeleton"
import { Separator } from "@viral-scout/ui/components/separator"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from "@viral-scout/ui/components/card"
import { AnalyticsChartsLazy } from "@/features/analytics/components/analytics-charts-lazy"

export const metadata = {
  title: "Analytics"
}

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col h-full bg-background">
      <DashboardHeader title="Analytics" description="Insights & Trends" />

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Suspense
          fallback={
            <div className="px-8 py-8 max-w-7xl mx-auto w-full space-y-8">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-87.5 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          }
        >
          <AnalyticsContent />
        </Suspense>
      </div>
    </div>
  )
}

const AnalyticsContent = async () => {
  const { platformStats, topTags, viralityDistribution } = await fetchAnalyticsData()

  const platformChartData = platformStats.map((s) => ({
    platform: s.platform,
    totalPosts: s.totalPosts,
    hotPosts: s.hotPosts,
    avgScore: Number(s.avgScore?.toFixed(1) ?? 0)
  }))

  const viralityChartData = viralityDistribution.map((d) => ({
    score: `${d.bucket}`,
    postCount: d.postCount
  }))

  const maxTagCount = topTags[0]?.postCount ?? 1

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Page title */}
      <div>
        <h2 className="text-2xl font-bold font-display tracking-tight">Viral Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Analyze virality trends over the past 7 days
        </p>
      </div>

      {/* Charts — Client Component (loaded dynamically) */}
      <AnalyticsChartsLazy
        platformChartData={platformChartData}
        viralityChartData={viralityChartData}
      />

      <Separator className="border-border/40" />

      {/* Top Tags */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-1.5">
            <HugeiconsIcon icon={TrendingUp} className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold font-display">Top Tags</CardTitle>
          </div>
          <CardDescription className="text-xs">Most frequent tags in viral posts</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {topTags.every((t) => (t.postCount ?? 0) === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tag data available</p>
          ) : (
            <div className="space-y-3">
              {topTags
                .filter((t) => (t.postCount ?? 0) > 0)
                .map((tag) => {
                  const width = Math.min(100, ((tag.postCount ?? 0) / maxTagCount) * 100)
                  return (
                    <div key={tag.slug} className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold shrink-0 rounded-md min-w-20 justify-center"
                      >
                        {tag.labelVi}
                      </Badge>
                      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs tabular-nums font-semibold text-foreground w-6 text-right">
                          {tag.postCount ?? 0}
                        </span>
                        <span className="text-[10px] tabular-nums text-muted-foreground font-mono w-14 text-right">
                          avg {Number(tag.avgVirality ?? 0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
