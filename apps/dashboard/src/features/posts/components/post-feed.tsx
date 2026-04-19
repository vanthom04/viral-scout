"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { SearchX } from "@hugeicons/core-free-icons"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle
} from "@viral-scout/ui/components/empty"
import { Button } from "@viral-scout/ui/components/button"

import { PostCard } from "./post-card"
import { TagFilterBar } from "./tag-filter-bar"

// Matches getViralPosts return type
type PostItem = {
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
  hookAngles: string
  analyzedAt: string
}

interface PostFeedProps {
  initialPosts: PostItem[]
}

export const PostFeed = ({ initialPosts }: PostFeedProps) => {
  const router = useRouter()

  const [platforms, setPlatforms] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [minVirality, setMinVirality] = useState("5")

  const filtered = useMemo(() => {
    const minScore = parseFloat(minVirality)
    return initialPosts.filter((post) => {
      if (post.viralityScore < minScore) return false
      if (platforms.length > 0 && !platforms.includes(post.platform)) return false
      return true
    })
  }, [initialPosts, platforms, minVirality])

  const handleGenerateIdea = (postId: string) => {
    router.push(`/idea-generator?postId=${postId}`)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
      {/* Filter sidebar */}
      <div className="lg:sticky lg:top-24">
        <TagFilterBar
          platforms={platforms}
          tags={tags}
          minVirality={minVirality}
          onPlatformChange={setPlatforms}
          onTagChange={setTags}
          onViralityChange={setMinVirality}
        />
      </div>

      {/* Posts list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon" className="p-7 rounded-lg">
              <HugeiconsIcon icon={SearchX} className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No posts found</EmptyTitle>
            <EmptyDescription>
              Try changing filters or wait for cron job to update new data.
            </EmptyDescription>
            <EmptyContent>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPlatforms([])
                  setTags([])
                  setMinVirality("5")
                }}
              >
                Clear filters
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {filtered.length} posts · sorted by virality
            </p>
            {filtered.map((post) => (
              <PostCard key={post.postId} post={post} onGenerateIdea={handleGenerateIdea} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
