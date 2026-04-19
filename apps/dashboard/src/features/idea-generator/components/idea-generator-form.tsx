"use client"

import { toast } from "sonner"
import { useState, useTransition } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Sparkles, RotateCcw, Copy, Check } from "@hugeicons/core-free-icons"

import { ViralityBadge } from "@/features/posts/components/virality-badge"

import { Badge } from "@viral-scout/ui/components/badge"
import { Button } from "@viral-scout/ui/components/button"
import { Separator } from "@viral-scout/ui/components/separator"
import { Card, CardContent, CardHeader } from "@viral-scout/ui/components/card"

import { IdeaResultStream } from "./idea-result-stream"

interface PostSummary {
  postId: string
  platform: string
  title: string
  body: string
  contentType: string
  hookAngles: string // JSON string
  viralityScore: number
}

interface IdeaGeneratorFormProps {
  post: PostSummary
}

const PLATFORM_LABEL: Record<string, string> = {
  reddit: "Reddit",
  youtube: "YouTube",
  facebook: "Facebook",
  tiktok: "TikTok",
  twitter: "X",
  linkedin: "LinkedIn"
}

export const IdeaGeneratorForm = ({ post }: IdeaGeneratorFormProps) => {
  const [streamedContent, setStreamedContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [copied, setCopied] = useState(false)
  const [, startTransition] = useTransition()

  const hookAngles: string[] = (() => {
    try {
      return JSON.parse(post.hookAngles) as string[]
    } catch {
      return []
    }
  })()

  const handleGenerate = () => {
    startTransition(async () => {
      setStreamedContent("")
      setIsStreaming(true)

      try {
        const response = await fetch("/api/generate-idea", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: post.title,
            body: post.body,
            platform: post.platform,
            contentType: post.contentType,
            hookAngles
          })
        })

        if (!response.ok || !response.body) {
          toast.error("AI is temporarily unavailable, please try again")
          setIsStreaming(false)
          return
        }

        // Read SSE stream from Workers AI
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Parse SSE events: "data: {...}\n\n"
          const events = buffer.split("\n\n")
          buffer = events.pop() ?? ""

          for (const event of events) {
            const dataLine = event.trim().replace(/^data:\s*/, "")
            if (dataLine === "[DONE]" || dataLine === "") continue
            try {
              const parsed = JSON.parse(dataLine) as { response?: string }
              if (parsed.response) {
                setStreamedContent((prev) => prev + parsed.response)
              }
            } catch {
              // Ignore parse errors — some chunks are not JSON
            }
          }
        }
      } catch {
        toast.error("Connection error, please try again")
      } finally {
        setIsStreaming(false)
      }
    })
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(streamedContent)
    setCopied(true)
    toast.success("Content copied")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5">
      {/* Post info card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{PLATFORM_LABEL[post.platform] ?? post.platform}</Badge>
                <ViralityBadge score={post.viralityScore} />
              </div>
              <p className="font-medium leading-snug">{post.title}</p>
            </div>
          </div>
        </CardHeader>

        {hookAngles.length > 0 && (
          <>
            <Separator />
            <CardContent className="pt-3 pb-3 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Angles from AI scan
              </p>
              {hookAngles.map((angle, i) => (
                <p key={i} className="text-sm text-muted-foreground flex gap-1.5">
                  <span className="text-primary font-medium shrink-0">→</span>
                  {angle}
                </p>
              ))}
            </CardContent>
          </>
        )}
      </Card>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button onClick={handleGenerate} disabled={isStreaming} className="gap-2">
          <HugeiconsIcon icon={Sparkles} />
          {isStreaming ? "Generating..." : "Generate Ideas"}
        </Button>

        {streamedContent && !isStreaming && (
          <>
            <Button variant="outline" size="sm" onClick={handleGenerate} className="gap-1.5">
              <HugeiconsIcon icon={RotateCcw} className="size-3.5" />
              Regenerate
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 ml-auto">
              {copied ? (
                <HugeiconsIcon icon={Check} className="size-3.5 text-green-500" />
              ) : (
                <HugeiconsIcon icon={Copy} className="size-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </>
        )}
      </div>

      {/* Stream output */}
      <IdeaResultStream content={streamedContent} isStreaming={isStreaming} />
    </div>
  )
}
