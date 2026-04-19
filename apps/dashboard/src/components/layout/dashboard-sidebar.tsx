"use client"

import Link from "next/link"

import { HugeiconsIcon } from "@hugeicons/react"
import { usePathname, useRouter } from "next/navigation"
import { TrendingUp, Lightbulb, BarChart, Activity, LogOut, Zap } from "@hugeicons/core-free-icons"

import { signOut, useSession } from "@/lib/auth-client"
import { cn } from "@viral-scout/ui/lib/utils"
import { Avatar, AvatarFallback } from "@viral-scout/ui/components/avatar"
import {
  Sidebar,
  SidebarFooter,
  SidebarGroup,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupContent,
  useSidebar
} from "@viral-scout/ui/components/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@viral-scout/ui/components/dropdown-menu"

const NAV_ITEMS = [
  {
    label: "Trending Feed",
    href: "/trending",
    icon: TrendingUp,
    description: "Real-time viral posts"
  },
  {
    label: "Idea Generator",
    href: "/idea-generator",
    icon: Lightbulb,
    description: "AI hook & script generation"
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart,
    description: "Virality heatmap & trends"
  },
  {
    label: "Source Monitor",
    href: "/monitor",
    icon: Activity,
    description: "Cron jobs health status"
  }
] as const

export const DashboardSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const router = useRouter()
  const pathname = usePathname()
  const { state } = useSidebar()
  const { data: session } = useSession()

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
    router.refresh()
  }

  const userInitials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "VS"

  return (
    <Sidebar {...props}>
      {/* Logo */}
      <SidebarHeader className="p-0 px-4 h-16 flex flex-col justify-center border-b border-sidebar-border">
        <Link href="/trending" className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0 transition-all duration-300",
              state === "collapsed" && "size-8 rounded-sm"
            )}
          >
            <HugeiconsIcon
              icon={Zap}
              strokeWidth={2}
              className={cn("size-4.5", state === "collapsed" && "size-3.5")}
            />
          </div>
          <div className="flex-1 whitespace-nowrap shrink-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold leading-none">Viral Scout</p>
            <p className="text-xs text-muted-foreground mt-0.5">Content Intelligence</p>
          </div>
        </Link>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-0.75">
        <SidebarGroup className="mt-1">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.description}>
                      <Link href={item.href}>
                        <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-5" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User footer */}
      <SidebarFooter className="p-2.75 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="h-10 w-full">
              <Avatar className={cn("size-7", state === "collapsed" && "size-8")}>
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left min-w-0 whitespace-nowrap shrink-0">
                <span className="text-sm font-medium truncate">
                  {session?.user?.name ?? "User"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {session?.user?.email ?? ""}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleSignOut} variant="destructive">
              <HugeiconsIcon icon={LogOut} strokeWidth={2} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
