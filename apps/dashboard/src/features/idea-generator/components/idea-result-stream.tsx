"use client"

import { useEffect, useRef } from "react"

import { cn } from "@viral-scout/ui/lib/utils"
import { Spinner } from "@viral-scout/ui/components/spinner"

interface IdeaResultStreamProps {
  content: string
  isStreaming: boolean
}

// Simple Markdown render — no extra libraries needed
const renderMarkdown = (text: string) => {
  const lines = text.split("\n")
  return lines.map((line, i) => {
    if (line.startsWith("## "))
      return (
        <h2 key={i} className="text-base font-semibold mt-5 mb-1.5 first:mt-0">
          {line.replace("## ", "")}
        </h2>
      )
    if (line.startsWith("- ") || line.startsWith("• "))
      return (
        <li key={i} className="ml-4 text-sm text-muted-foreground leading-relaxed">
          {line.replace(/^[-•]\s/, "")}
        </li>
      )
    if (line.match(/^\d+\.\s/))
      return (
        <li key={i} className="ml-4 text-sm leading-relaxed list-decimal">
          {line.replace(/^\d+\.\s/, "")}
        </li>
      )
    if (line.trim() === "") return <br key={i} />
    return (
      <p key={i} className="text-sm leading-relaxed">
        {line}
      </p>
    )
  })
}

export const IdeaResultStream = ({ content, isStreaming }: IdeaResultStreamProps) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll when new content arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [content])

  if (!content && !isStreaming) return null

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 space-y-1 transition-all",
        isStreaming && "border-primary/40"
      )}
    >
      {isStreaming && !content && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          <span>Generating ideas...</span>
        </div>
      )}

      <div className="prose-sm max-w-none">{renderMarkdown(content)}</div>

      {isStreaming && content && (
        <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
      )}

      <div ref={bottomRef} />
    </div>
  )
}
