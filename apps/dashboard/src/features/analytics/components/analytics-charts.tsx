"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@viral-scout/ui/components/chart"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@viral-scout/ui/components/card"

const platformChartConfig: ChartConfig = {
  totalPosts: {
    label: "Total posts",
    color: "hsl(var(--chart-1))"
  },
  hotPosts: {
    label: "Hot posts",
    color: "hsl(var(--chart-2))"
  }
}

const viralityChartConfig: ChartConfig = {
  postCount: {
    label: "Post count",
    color: "hsl(var(--chart-3))"
  }
}

type PlatformChartItem = {
  platform: string
  totalPosts: number
  hotPosts: number
  avgScore: number
}

type ViralityChartItem = {
  score: string
  postCount: number
}

export interface Props {
  platformChartData: PlatformChartItem[]
  viralityChartData: ViralityChartItem[]
}

export const AnalyticsCharts = ({ platformChartData, viralityChartData }: Props) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Platform Analysis</CardTitle>
          <CardDescription className="text-xs">
            Total posts and hot posts (virality ≥ 8.5) per platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={platformChartConfig} className="h-64 w-full">
            <BarChart data={platformChartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="platform" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="totalPosts" fill="var(--color-totalPosts)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="hotPosts" fill="var(--color-hotPosts)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Virality Score Distribution</CardTitle>
          <CardDescription className="text-xs">Post count by score (last 7 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={viralityChartConfig} className="h-52 w-full">
            <BarChart data={viralityChartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="score"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                label={{ value: "Score", position: "insideBottom", offset: -2, fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="postCount" fill="var(--color-postCount)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </>
  )
}
