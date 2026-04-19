import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Lightbulb, ArrowRight, Sparkles } from "@hugeicons/core-free-icons"

import { fetchPostById } from "@/features/posts/queries"
import { IdeaGeneratorForm } from "@/features/idea-generator/components/idea-generator-form"

import { Button } from "@viral-scout/ui/components/button"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@viral-scout/ui/components/empty"

export const metadata = {
  title: "Idea Generator"
}

interface PageProps {
  searchParams: Promise<{ postId?: string }>
}

export default function IdeaGeneratorPage({ searchParams }: PageProps) {
  return (
    <div className="flex flex-col h-full bg-background">
      <DashboardHeader title="Idea Generator" description="AI Creative Engine" />

      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-8">
            <HugeiconsIcon
              icon={Lightbulb}
              className="size-9 animate-pulse text-muted-foreground/30"
            />
          </div>
        }
      >
        <IdeaGeneratorMain searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function IdeaGeneratorMain({ searchParams }: PageProps) {
  const { postId } = await searchParams

  if (!postId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Empty className="max-w-sm text-center">
          <EmptyMedia className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl bg-primary/8 text-primary">
            <HugeiconsIcon icon={Lightbulb} className="size-9" />
          </EmptyMedia>
          <EmptyTitle className="text-xl font-bold font-display">No post selected</EmptyTitle>
          <EmptyDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Go to Trending Feed, find a viral post and click{" "}
            <span className="font-medium text-foreground">&quot;Generate Ideas&quot;</span>.
          </EmptyDescription>
          <div className="mt-8">
            <Button className="gap-1.5" asChild>
              <Link href="/trending" className="flex items-center">
                <span>Trending Feed</span>
                <HugeiconsIcon icon={ArrowRight} className="size-4" strokeWidth={2.5} />
              </Link>
            </Button>
          </div>
        </Empty>
      </div>
    )
  }

  return <IdeaGeneratorContent postId={postId} />
}

async function IdeaGeneratorContent({ postId }: { postId: string }) {
  const result = await fetchPostById(postId)

  if (!result) return notFound()

  const post = {
    postId: result.posts.id,
    platform: result.posts.platform,
    title: result.posts.title,
    body: result.posts.body,
    contentType: result.analyzed_posts.contentType,
    hookAngles: result.analyzed_posts.hookAngles,
    viralityScore: result.analyzed_posts.viralityScore
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-8 py-8 max-w-4xl mx-auto w-full space-y-8">
        {/* Page title */}
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0 mt-0.5">
            <HugeiconsIcon icon={Sparkles} className="size-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display tracking-tight">Content Ideas</h2>
            <p className="text-sm text-muted-foreground mt-1">
              AI is analyzing the{" "}
              <span className="font-medium text-foreground capitalize">{post.platform}</span> post to generate brand-aligned content.
            </p>
          </div>
        </div>

        <IdeaGeneratorForm post={post} />
      </div>
    </div>
  )
}
