"use client"

import { Badge } from "@viral-scout/ui/components/badge"
import { Separator } from "@viral-scout/ui/components/separator"
import { ToggleGroup, ToggleGroupItem } from "@viral-scout/ui/components/toggle-group"

const PLATFORMS = [
  { value: "reddit", label: "Reddit" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "twitter", label: "X" },
  { value: "linkedin", label: "LinkedIn" }
] as const

const VIRALITY_OPTIONS = [
  { value: "5", label: "5+" },
  { value: "7", label: "7+" },
  { value: "8.5", label: "🔥 8.5+" }
] as const

const TAG_OPTIONS = [
  { value: "thu-nhap-thu-dong", label: "Passive income" },
  { value: "tu-do-tai-chinh", label: "Financial freedom" },
  { value: "personal-brand", label: "Personal brand" },
  { value: "content-viral", label: "Content viral" },
  { value: "dong-tien", label: "Cash flow" },
  { value: "kiem-tien-online", label: "Make money online" }
] as const

interface TagFilterBarProps {
  platforms: string[]
  tags: string[]
  minVirality: string
  onPlatformChange: (values: string[]) => void
  onTagChange: (values: string[]) => void
  onViralityChange: (value: string) => void
}

export const TagFilterBar = ({
  platforms,
  tags,
  minVirality,
  onPlatformChange,
  onTagChange,
  onViralityChange
}: TagFilterBarProps) => {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      {/* Platform filter */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Platform
        </p>
        <ToggleGroup
          type="multiple"
          value={platforms}
          onValueChange={onPlatformChange}
          className="flex flex-wrap gap-1.5 justify-start"
        >
          {PLATFORMS.map((p) => (
            <ToggleGroupItem
              key={p.value}
              value={p.value}
              size="sm"
              className="h-8 px-3! text-xs rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {p.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Separator />

      {/* Virality filter */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Minimum virality
        </p>
        <ToggleGroup
          type="single"
          value={minVirality}
          onValueChange={(v) => {
            if (v) onViralityChange(v)
          }}
          className="flex gap-1.5 justify-start"
        >
          {VIRALITY_OPTIONS.map((o) => (
            <ToggleGroupItem
              key={o.value}
              value={o.value}
              size="sm"
              className="h-8 px-3! text-xs rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {o.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Separator />

      {/* Tags filter */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tags</p>
        <div className="flex flex-wrap gap-2">
          {TAG_OPTIONS.map((tag) => {
            const isActive = tags.includes(tag.value)
            return (
              <Badge
                key={tag.value}
                variant={isActive ? "default" : "outline"}
                className="px-4 py-3 cursor-pointer select-none transition-colors hover:bg-primary/90 hover:text-primary-foreground"
                onClick={() => {
                  if (isActive) {
                    onTagChange(tags.filter((t) => t !== tag.value))
                  } else {
                    onTagChange([...tags, tag.value])
                  }
                }}
              >
                {tag.label}
              </Badge>
            )
          })}
        </div>
      </div>
    </div>
  )
}
