import { Suspense } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { TrendingUp, Zap, Activity, BarChart } from "@hugeicons/core-free-icons"

import { PostFeed } from "@/features/posts/components/post-feed"

import { getDb } from "@/lib/db"
import { cn } from "@viral-scout/ui/lib/utils"
import { Skeleton } from "@viral-scout/ui/components/skeleton"
import { Separator } from "@viral-scout/ui/components/separator"
import { Card, CardContent } from "@viral-scout/ui/components/card"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { getViralPosts, getViralityStats } from "@viral-scout/database"

export const metadata = {
  title: "Trending"
}

async function fetchTrendingData() {
  const db = await getDb()
  const [posts, stats] = await Promise.all([
    getViralPosts(db, { minVirality: 5, limit: 30 }),
    getViralityStats(db)
  ])
  return { posts, stats }
}

interface MetricCardProps {
  label: string
  value: string
  sub?: string
  icon: typeof TrendingUp
  highlight?: boolean
}

const MetricCard = ({ label, value, sub, icon, highlight = false }: MetricCardProps) => (
  <Card className={cn("border-none shadow-sm", highlight ? "bg-primary/5" : "bg-muted/30")}>
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-none">
          {label}
        </p>
        <div
          className={cn(
            "p-1.5 rounded-md",
            highlight
              ? "bg-primary/10 text-primary"
              : "bg-background text-muted-foreground shadow-xs"
          )}
        >
          <HugeiconsIcon icon={icon} className="size-3.5" />
        </div>
      </div>
      <p
        className={cn(
          "text-2xl font-bold font-display tabular-nums leading-none",
          highlight && "text-primary"
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground mt-2 font-medium">{sub}</p>}
    </CardContent>
  </Card>
)

async function TrendingContent() {
  const { posts, stats } = await fetchTrendingData()

  const totalToday = posts.length
  const hotPosts = posts.filter((p) => p.viralityScore >= 8.5).length
  const avgVirality =
    posts.length > 0
      ? (posts.reduce((s, p) => s + p.viralityScore, 0) / posts.length).toFixed(1)
      : "-"

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-8 py-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Page title */}
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight">Viral Content</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Fastest spreading content · updated from {stats.length} sources
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Posts today"
            value={totalToday.toLocaleString()}
            sub="AI analyzed"
            icon={BarChart}
          />
          <MetricCard
            label="Hot content"
            value={hotPosts.toString()}
            sub="Virality ≥ 8.5"
            icon={Zap}
            highlight
          />
          <MetricCard
            label="Avg. virality"
            value={avgVirality}
            sub="Across entire feed"
            icon={TrendingUp}
          />
          <MetricCard
            label="Active sources"
            value={`${stats.length} / 6`}
            sub="Running scrapers"
            icon={Activity}
          />
        </div>

        <Separator className="border-border/40" />

        {/* Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold font-display">Content Feed</h3>
            <span className="text-xs text-muted-foreground">
              Sorted by <span className="text-primary font-medium">Virality Score</span>
            </span>
          </div>
          <PostFeed initialPosts={posts} />
        </div>
      </div>
    </div>
  )
}

export default function TrendingPage() {
  return (
    <div className="flex flex-col h-full bg-background">
      <DashboardHeader title="Trending Feed" description="Real-time viral content" />

      <Suspense
        fallback={
          <div className="px-8 py-8 max-w-7xl mx-auto w-full space-y-8">
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          </div>
        }
      >
        <TrendingContent />
      </Suspense>
    </div>
  )
}
