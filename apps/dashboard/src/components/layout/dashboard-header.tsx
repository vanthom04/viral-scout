import { Separator } from "@viral-scout/ui/components/separator"
import { SidebarTrigger } from "@viral-scout/ui/components/sidebar"

interface Props {
  title: string
  description?: string
}

export const DashboardHeader = ({ title, description }: Props) => {
  return (
    <header className="flex items-center h-16 px-5 border-b border-border/60 sticky top-0 bg-background/80 backdrop-blur-md z-10 shrink-0">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-2.5 h-full" />
      <div className="min-w-0">
        <h1 className="text-sm font-semibold font-display leading-none">{title}</h1>
        {description && (
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 mt-0.5">
            {description}
          </p>
        )}
      </div>
    </header>
  )
}
