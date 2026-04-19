import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"

import { cn } from "@viral-scout/ui/lib/utils"

function Spinner({ className, strokeWidth, ...props }: React.ComponentProps<"svg">) {
  return (
    <HugeiconsIcon
      icon={Loading03Icon}
      role="status"
      aria-label="Loading"
      strokeWidth={typeof strokeWidth === "number" ? strokeWidth : 2}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
