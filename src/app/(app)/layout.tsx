import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { api } from "@/lib/api/server"
import { DashboardHeader } from "@/modules/dashboard/layout/header"
import { DashboardSidebar } from "@/modules/dashboard/layout/sidebar/sidebar"
import { requireSession } from "@/server/auth/utils"

export default async function Layout({ children }: LayoutProps<"/">) {
  const session = await requireSession()
  const organization = await api.organization.get()

  return (
    <SidebarProvider>
      <div
        className="relative flex min-h-dvh w-full bg-muted before:fixed before:inset-x-0 before:top-0 before:h-105 before:bg-primary/80 dark:bg-background"
        style={
          {
            "--header-height": "3rem",
            "--sidebar": "var(--card)",
            "--sidebar-width": "17.5rem",
            "--sidebar-width-icon": "3.375rem",
          } as React.CSSProperties
        }
      >
        <DashboardSidebar orgSlug={organization.slug} />
        <SidebarInset className="z-1 mx-auto max-w-360 bg-transparent px-4 max-md:py-4 md:mt-1! md:pr-2 md:pl-0">
          <DashboardHeader session={session} />
          <div className="size-full flex-1 pt-6">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
