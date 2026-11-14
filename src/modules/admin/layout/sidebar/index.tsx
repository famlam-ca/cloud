"use client"

import {
  IconActivity,
  IconAdjustmentsHorizontal,
  IconBell,
  IconBox,
  IconCloud,
  IconHierarchy2,
  IconKey,
  IconLayoutDashboard,
  IconNetwork,
  IconPackages,
  IconServer2,
  IconUser,
} from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Icons } from "@/components/icons"
import { FooterNav } from "@/components/sidebar/footer-nav"
import { MainNav } from "@/components/sidebar/main-nav"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { APP_NAME } from "@/constants/app"
import { api } from "@/lib/api/client"
import type { NavItem } from "@/schemas/nav-item"

type NavItems = {
  access: NavItem[]
  compute: NavItem[]
  footer: NavItem[]
  main: NavItem[]
  networking: NavItem[]
  operations: NavItem[]
  tenancy: NavItem[]
}

export function AdminSidebar() {
  const pathname = usePathname()

  const { data: instanceCount } = api.admin.instance.count.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })
  const allocationCount = 2
  const orgCount = 4
  const notificationCount = 3

  function resourceCount(
    resource: "instance" | "allocation" | "org" | "notification",
  ) {
    const countMap: Record<string, number> = {
      allocation: allocationCount || 0,
      instance: instanceCount || 0,
      notification: notificationCount || 0,
      org: orgCount || 0,
    }

    const count = countMap[resource]

    return count > 0 ? (
      <SidebarMenuBadge className="bg-primary/10 top-1/2! right-2 -translate-y-1/2! rounded-full">
        {count}
      </SidebarMenuBadge>
    ) : (
      <Skeleton className="absolute top-1/2! right-2 size-4 -translate-y-1/2! rounded-full" />
    )
  }

  const NAV_ITEMS: NavItems = {
    access: [
      {
        href: "/admin/ssh-keys",
        icon: IconKey,
        isActive: pathname === "/admin/ssh-keys",
        label: "SSH Keys",
      },
    ],
    compute: [
      {
        extra: {
          render: resourceCount("instance"),
        },
        href: "/admin/instances",
        icon: IconServer2,
        isActive: pathname === "/admin/instances",
        label: "Instances",
      },
      {
        href: "/admin/plans",
        icon: IconBox,
        isActive: pathname === "/admin/plans",
        label: "Resource Plans",
      },
      {
        href: "/admin/templates",
        icon: IconPackages,
        isActive: pathname === "/admin/templates",
        label: "Templates",
      },
    ],
    footer: [
      {
        href: "/admin/settings",
        icon: IconAdjustmentsHorizontal,
        isActive: pathname === "/admin/settings",
        label: "Platform Settings",
      },
    ],
    main: [
      {
        href: "/admin",
        icon: IconLayoutDashboard,
        isActive: pathname === "/admin",
        label: "Dashboard",
      },
    ],
    networking: [
      {
        href: "/admin/networks",
        icon: IconHierarchy2,
        isActive: pathname === "/admin/networks",
        label: "Networks",
      },
      {
        extra: {
          render: resourceCount("allocation"),
        },
        href: "/admin/allocations",
        icon: IconNetwork,
        isActive: pathname === "/admin/allocations",
        label: "IP Allocations",
      },
    ],
    operations: [
      {
        href: "/admin/activity",
        icon: IconActivity,
        isActive: pathname === "/admin/activity",
        label: "Activity",
      },
      {
        extra: {
          render: resourceCount("notification"),
        },
        href: "/admin/notifications",
        icon: IconBell,
        isActive: pathname === "/admin/notifications",
        label: "Notifications",
      },
    ],
    tenancy: [
      {
        href: "/admin/users",
        icon: IconUser,
        isActive: pathname === "/admin/users",
        label: "Users",
      },
      {
        extra: {
          render: resourceCount("org"),
        },
        href: "/admin/orgs",
        icon: IconCloud,
        isActive: pathname === "/admin/orgs",
        label: "Organizations",
      },
    ],
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="gap-2.5 bg-transparent! p-2 group-data-[collapsible=icon]:p-0! [&_svg]:size-4 [&>svg]:size-8"
              render={<Link href="/admin" />}
              size="lg"
            >
              <Icons.logo />
              <div className="flex flex-col items-start">
                <span className="text-lg font-semibold text-nowrap">
                  {APP_NAME}
                </span>
                <span className="text-xs font-light text-nowrap">
                  Admin Panel
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="group-data-[collapsible=icon]:overflow-y-auto">
        <MainNav items={NAV_ITEMS.main} title="Overview" />
        <MainNav items={NAV_ITEMS.compute} title="Compute" />
        <MainNav items={NAV_ITEMS.networking} title="Networking" />
        <MainNav items={NAV_ITEMS.tenancy} title="Tenancy" />
        <MainNav items={NAV_ITEMS.access} title="Access" />
        <MainNav items={NAV_ITEMS.operations} title="Operations" />
      </SidebarContent>
      <SidebarFooter className="px-0">
        <FooterNav items={NAV_ITEMS.footer} title={null} />
      </SidebarFooter>
    </Sidebar>
  )
}
