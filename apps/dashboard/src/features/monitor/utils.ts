import { CheckCircle, AlertCircle, AlertTriangle } from "@hugeicons/core-free-icons"

export const STATUS_CONFIG = {
  success: {
    label: "Optimal",
    badgeClass: "bg-success/10 text-success border-success/20 border",
    icon: CheckCircle
  },
  partial: {
    label: "Degraded",
    badgeClass: "bg-warning/10 text-warning border-warning/20 border",
    icon: AlertTriangle
  },
  failed: {
    label: "Critical",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20 border",
    icon: AlertCircle
  }
} as const

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export const formatRelativeTime = (isoString: string): string => {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffM = Math.floor(diffMs / 60_000)
  if (diffM < 1) return "just now"
  if (diffM < 60) return `${diffM} mins ago`
  const diffH = Math.floor(diffM / 60)
  if (diffH < 24) return `${diffH} hours ago`
  return `${Math.floor(diffH / 24)} days ago`
}
