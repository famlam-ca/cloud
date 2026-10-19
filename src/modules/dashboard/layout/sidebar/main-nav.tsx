import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import type { NavItem } from "./sidebar"

export function MainNav({ items, title }: { items: NavItem[]; title: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-2 uppercase tracking-wider">
        {title}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={item.isActive}
                  // @ts-expect-error: cannot use typedRoutes here
                  render={<Link href={item.href} />}
                  tooltip={item.label}
                >
                  <Icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
                {item.extra?.render}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
