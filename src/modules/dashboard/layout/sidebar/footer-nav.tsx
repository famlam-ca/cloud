import { IconExternalLink } from "@tabler/icons-react"
import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import type { NavItem } from "./sidebar"

export function FooterNav({ items }: { items: NavItem[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-2 tracking-wider uppercase">
        Resources
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon

          const isExternalLink =
            item.href.startsWith("https://") || item.href.startsWith("http://")

          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={item.isActive}
                render={
                  <Link
                    // @ts-expect-error: cannot use typedRoutes here
                    href={item.href}
                    target={isExternalLink ? "_blank" : "_self"}
                  />
                }
                tooltip={item.label}
              >
                <Icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
              {isExternalLink && (
                <SidebarMenuBadge>
                  <IconExternalLink className="size-3.5!" />
                </SidebarMenuBadge>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
