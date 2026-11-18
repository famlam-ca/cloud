"use client"

import {
  IconActivity,
  IconAdjustmentsHorizontal,
  IconBell,
  IconBox,
  IconCloudComputing,
  IconDatabase,
  IconKey,
  IconLayoutDashboard,
  IconLogout2,
  IconNetwork,
  IconServer2,
  IconSitemap,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Hint } from "@/components/hint"
import { Icons } from "@/components/icons"
import { MainNav } from "@/components/sidebar/main-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { UserMenuContent } from "@/components/user-menu"
import { APP_NAME } from "@/constants/app"
import { api } from "@/lib/api/client"
import type { NavItem } from "@/schemas/nav-item"
import type { User } from "@/server/auth/utils"

function UserInfo({ user }: { user: User }) {
  return (
    <>
      <Avatar className="size-8">
        <AvatarImage alt={user.name} src={user.image || ""} />
        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        <span className="truncate text-xs">{user.email}</span>
      </div>
    </>
  )
}

function UserNav({ user }: { user: User }) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                size="lg"
              />
            }
          >
            <UserInfo user={user} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-(--anchor-width) min-w-80"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <UserMenuContent user={user} />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

type NavItems = {
  compute: NavItem[]
  networking: NavItem[]
  operations: NavItem[]
  platform: NavItem[]
  tenancy: NavItem[]
}

export function AdminSidebar({ user }: { user: User }) {
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
        icon: IconDatabase,
        isActive: pathname === "/admin/templates",
        label: "Templates",
      },
    ],
    networking: [
      {
        href: "/admin/networks",
        icon: IconSitemap,
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
    platform: [
      {
        href: "/admin",
        icon: IconLayoutDashboard,
        isActive: pathname === "/admin",
        label: "Dashboard",
      },
      {
        href: "/admin/infra",
        icon: IconCloudComputing,
        isActive: pathname === "/admin/infra",
        label: "Infrastructure",
      },
      {
        href: "/admin/settings",
        icon: IconAdjustmentsHorizontal,
        isActive: pathname === "/admin/settings",
        label: "Platform Settings",
      },
    ],
    tenancy: [
      {
        href: "/admin/users",
        icon: IconUsers,
        isActive: pathname === "/admin/users",
        label: "Users",
      },
      {
        extra: {
          render: resourceCount("org"),
        },
        href: "/admin/orgs",
        icon: IconUsersGroup,
        isActive: pathname === "/admin/orgs",
        label: "Organizations",
      },
      {
        href: "/admin/ssh-keys",
        icon: IconKey,
        isActive: pathname === "/admin/ssh-keys",
        label: "SSH Keys",
      },
    ],
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center">
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
            <Hint
              label="Exit Admin Panel"
              render={
                <Link
                  className={buttonVariants({
                    className: "ml-auto cursor-pointer",
                    size: "icon-sm",
                    variant: "ghost",
                  })}
                  href="/"
                >
                  <IconLogout2 className="size-5" />
                </Link>
              }
              side="right"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="group-data-[collapsible=icon]:overflow-y-auto">
        <MainNav items={NAV_ITEMS.platform} title="Platform" />
        <MainNav items={NAV_ITEMS.compute} title="Compute" />
        <MainNav items={NAV_ITEMS.networking} title="Networking" />
        <MainNav items={NAV_ITEMS.tenancy} title="Tenancy" />
        <MainNav items={NAV_ITEMS.operations} title="Operations" />
      </SidebarContent>
      <SidebarFooter>
        <UserNav user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
