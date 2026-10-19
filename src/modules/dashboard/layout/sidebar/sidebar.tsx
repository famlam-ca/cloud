"use client"

import type { Icon as IconType } from "@tabler/icons-react"
import {
  IconActivity,
  IconApi,
  IconChevronRight,
  IconHeartHandshake,
  IconKey,
  IconLayoutDashboard,
  IconPlus,
  IconSearch,
  IconServer2,
  IconSettings2,
  IconSparkles2,
  IconTimeline,
  IconUpload,
  IconUsers,
} from "@tabler/icons-react"
import type { Route } from "next"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Icons } from "@/components/icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { APP_NAME } from "@/constants/app"
import { organizationPath } from "@/lib/organization-path"
import { getApiVersion, getBaseUrl } from "@/lib/utils"

import { FooterNav } from "./footer-nav"
import { MainNav } from "./main-nav"

export type NavItem = {
  extra?: {
    render: React.ReactNode
  }
  href: string
  icon: IconType
  isActive: boolean
  label: string
}

type NavItems = {
  main: NavItem[]
  footer: NavItem[]
  settings: NavItem[]
}

export function DashboardSidebar({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname()
  const orgPath = (path = "") => organizationPath(orgSlug, path)

  const NAV_ITEMS: NavItems = {
    footer: [
      {
        href: "https://hub.famlam.ca",
        icon: IconHeartHandshake,
        isActive: false,
        label: "HHN Hub",
      },
      {
        href: "https://wiki.famlam.ca",
        icon: IconSearch,
        isActive: false,
        label: "Wiki",
      },
      {
        href: `${getBaseUrl()}/roadmap`,
        icon: IconTimeline,
        isActive: pathname === "/roadmap",
        label: "Roadmap",
      },
      {
        href: `${getBaseUrl()}/api/v${getApiVersion()}`,
        icon: IconApi,
        isActive: false,
        label: "API Docs",
      },
    ],
    main: [
      {
        href: orgPath(),
        icon: IconLayoutDashboard,
        isActive: pathname === orgPath(),
        label: "Overview",
      },
      {
        extra: {
          render: (
            <SidebarMenuAction
              render={<Link href={orgPath("instances/create")} />}
            >
              <IconPlus />
              <span className="sr-only">Create Instance</span>
            </SidebarMenuAction>
          ),
        },
        href: orgPath("instances"),
        icon: IconServer2,
        isActive: pathname.startsWith(orgPath("instances")),
        label: "Instances",
      },
      {
        extra: {
          render: (
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuAction />}>
                <IconChevronRight />
                <span className="sr-only">Create SSH Key</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right">
                <DropdownMenuItem
                  render={
                    <Link
                      href={`${orgPath("ssh-keys")}?new=generate` as Route}
                    />
                  }
                >
                  <IconSparkles2 /> Generate New
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={
                    <Link href={`${orgPath("ssh-keys")}?new=import` as Route} />
                  }
                >
                  <IconUpload /> Import Existing
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        },
        href: orgPath("ssh-keys"),
        icon: IconKey,
        isActive: pathname.startsWith(orgPath("ssh-keys")),
        label: "SSH Keys",
      },
      {
        href: orgPath("members"),
        icon: IconUsers,
        isActive: pathname.startsWith(orgPath("members")),
        label: "Members",
      },
      {
        href: orgPath("activity"),
        icon: IconActivity,
        isActive: pathname.startsWith(orgPath("activity")),
        label: "Activity",
      },
    ],
    settings: [
      {
        href: orgPath("settings"),
        icon: IconSettings2,
        isActive: pathname.startsWith(orgPath("settings")),
        label: "General Settings",
      },
    ],
  }

  return (
    <Sidebar
      className="p-6 pr-0 *:data-[slot=sidebar-inner]:group-data-[variant=floating]:rounded-xl"
      collapsible="icon"
      variant="floating"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="gap-2.5 bg-transparent! p-2 group-data-[collapsible=icon]:p-0! [&>svg]:size-8 [&_svg]:size-4"
              render={<Link href={orgPath()} />}
              size="lg"
            >
              <Icons.logo />
              <div className="flex flex-col items-start">
                <span className="text-nowrap font-semibold text-lg">
                  {APP_NAME}
                </span>
                <span className="text-nowrap font-light text-xs">
                  Dashboard
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="group-data-[collapsible=icon]:overflow-y-auto">
        <MainNav items={NAV_ITEMS.main} title="Organization" />
        <MainNav items={NAV_ITEMS.settings} title="Settings" />
      </SidebarContent>
      <SidebarFooter className="px-0">
        <FooterNav items={NAV_ITEMS.footer} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
