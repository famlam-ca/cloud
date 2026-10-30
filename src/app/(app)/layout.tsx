import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { api, HydrateClient } from "@/lib/api/server"
import { DashboardHeader } from "@/modules/dashboard/layout/header"
import { DashboardSidebar } from "@/modules/dashboard/layout/sidebar/sidebar"
import { NotificationBanner } from "@/modules/notifications/ui/banner"
import { requireSession } from "@/server/auth/utils"

export default async function Layout({ children }: LayoutProps<"/">) {
  const session = await requireSession()
  const [organization] = await Promise.all([
    api.organization.get(),
    api.notification.banner.prefetch(),
  ])

  return (
    <SidebarProvider>
      <div
        className="bg-muted before:bg-primary/80 dark:bg-background relative flex min-h-dvh w-full before:fixed before:inset-x-0 before:top-0 before:h-105"
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
        <SidebarInset className="z-1 bg-transparent px-4 max-md:py-4 md:mt-1! md:pr-2 md:pl-0">
          <HydrateClient>
            <NotificationBanner />
          </HydrateClient>
          <DashboardHeader session={session} />
          <div className="size-full flex-1 pt-6">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
