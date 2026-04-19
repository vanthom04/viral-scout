"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { ExternalLink, Bookmark, BookmarkCheck, Sparkles } from "@hugeicons/core-free-icons"

import { savePostAction } from "../actions"

import { cn } from "@viral-scout/ui/lib/utils"
import { Badge } from "@viral-scout/ui/components/badge"
import { Button } from "@viral-scout/ui/components/button"
import { Separator } from "@viral-scout/ui/components/separator"
import { Card, CardContent, CardFooter } from "@viral-scout/ui/components/card"

import { ViralityBadge } from "./virality-badge"

// Matches getViralPosts query return type
interface PostCardProps {
  post: {
    postId: string
    platform: string
    url: string
    title: string
    body: string
    authorHandle: string
    publishedAt: string
    totalEngagement: number
    likesCount: number
    commentsCount: number
    sharesCount: number
    viralityScore: number
    contentType: string
    hookAngles: string // JSON string
    analyzedAt: string
  }
  onGenerateIdea?: (postId: string, title: string) => void
}

const PLATFORM_CONFIG: Record<string, { label: string; className: string }> = {
  reddit: {
    label: "Reddit",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200"
  },
  youtube: {
    label: "YouTube",
    className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
  },
  facebook: {
    label: "Facebook",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
  },
  tiktok: {
    label: "TikTok",
    className: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200"
  },
  twitter: {
    label: "X",
    className: "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
  },
  linkedin: {
    label: "LinkedIn",
    className: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200"
  }
}

const CONTENT_TYPE_LABEL: Record<string, string> = {
  story: "Story",
  list: "List",
  proof: "Proof",
  rant: "Opinion",
  "how-to": "How-to",
  question: "Question",
  news: "News"
}

const formatRelativeTime = (isoString: string): string => {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffH = Math.floor(diffMs / 3_600_000)
  if (diffH < 1) return "just now"
  if (diffH < 24) return `${diffH} hours ago`
  const diffD = Math.floor(diffH / 24)
  return `${diffD} days ago`
}

const formatNumber = (n: number): string => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

export const PostCard = ({ post, onGenerateIdea }: PostCardProps) => {
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    if (saved) return
    startTransition(async () => {
      const result = await savePostAction(post.postId)
      if (result.success) {
        setSaved(true)
        toast.success("Đã lưu bài viết")
      } else {
        toast.error(result.error)
      }
    })
  }

  const platform = PLATFORM_CONFIG[post.platform] ?? {
    label: post.platform,
    className: "bg-muted text-muted-foreground"
  }

  const hookAngles: string[] = (() => {
    try {
      return JSON.parse(post.hookAngles) as string[]
    } catch {
      return []
    }
  })()

  const isHot = post.viralityScore >= 8.5

  return (
    <Card
      className={cn("transition-shadow hover:shadow-md", isHot && "border-l-4 border-l-orange-400")}
    >
      <CardContent className="pt-4 pb-3 space-y-3">
        {/* Header row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn("text-xs font-medium border-0", platform.className)}>
            {platform.label}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {CONTENT_TYPE_LABEL[post.contentType] ?? post.contentType}
          </Badge>
          <span className="text-xs text-muted-foreground">
            @{post.authorHandle} · {formatRelativeTime(post.publishedAt)}
          </span>
          <ViralityBadge score={post.viralityScore} className="ml-auto" />
        </div>

        {/* Title */}
        <p className="font-medium leading-snug line-clamp-2">{post.title}</p>

        {/* Body preview */}
        {post.body.length > 0 && (
          <p className="text-sm text-muted-foreground line-clamp-2">{post.body}</p>
        )}

        {/* Hook angles */}
        {hookAngles.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Angles
            </p>
            <ul className="space-y-1">
              {hookAngles.slice(0, 2).map((angle, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                  <span className="text-primary font-medium mt-0.5">→</span>
                  <span>{angle}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Engagement stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>👍 {formatNumber(post.likesCount)}</span>
          <span>💬 {formatNumber(post.commentsCount)}</span>
          {post.sharesCount > 0 && <span>🔁 {formatNumber(post.sharesCount)}</span>}
        </div>
      </CardContent>

      <Separator />

      {/* Actions */}
      <CardFooter className="pt-3 pb-3 gap-2">
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => onGenerateIdea?.(post.postId, post.title)}
        >
          <HugeiconsIcon icon={Sparkles} className="h-3.5 w-3.5" />
          Generate Ideas
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a href={post.url} target="_blank" rel="noopener noreferrer">
            <HugeiconsIcon icon={ExternalLink} className="h-3.5 w-3.5" />
          </a>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          disabled={isPending || saved}
          onClick={handleSave}
          aria-label="Lưu bài viết"
        >
          {saved ? (
            <HugeiconsIcon icon={BookmarkCheck} className="h-3.5 w-3.5 text-primary" />
          ) : (
            <HugeiconsIcon icon={Bookmark} className="h-3.5 w-3.5" />
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
