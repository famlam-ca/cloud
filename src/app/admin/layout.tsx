import { SidebarProvider } from "@/components/ui/sidebar"
import { AdminHeader } from "@/modules/admin/layout/header"
import { AdminSidebar } from "@/modules/admin/layout/sidebar"

export default function Layout({ children }: LayoutProps<"/admin">) {
  return (
    <SidebarProvider>
      <div
        className="not-dark:bg-muted flex min-h-dvh w-full"
        style={
          {
            "--header-height": "3rem",
            "--sidebar": "var(--card)",
            "--sidebar-width": "17.5rem",
            "--sidebar-width-icon": "3.375rem",
          } as React.CSSProperties
        }
      >
        <AdminSidebar />
        <div className="flex-1">
          <AdminHeader />
          <main className="size-full flex-1 pt-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
