"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@viral-scout/ui/components/skeleton"

export const AnalyticsChartsLazy = dynamic(
  () => import("./analytics-charts").then((mod) => mod.AnalyticsCharts),
  {
    ssr: false,
    loading: () => <Skeleton className="h-87.5 w-full rounded-xl" />
  }
)
