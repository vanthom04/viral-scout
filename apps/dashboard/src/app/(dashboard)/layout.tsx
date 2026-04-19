import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { SidebarProvider, SidebarInset } from "@viral-scout/ui/components/sidebar"

interface Props {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: Props) {
  return (
    <SidebarProvider>
      <DashboardSidebar collapsible="icon" />
      <SidebarInset className="min-h-screen">{children}</SidebarInset>
    </SidebarProvider>
  )
}
