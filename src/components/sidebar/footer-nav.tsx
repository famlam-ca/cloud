import { IconExternalLink } from "@tabler/icons-react"
import { cn } from "cn"
import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import type { NavItem } from "@/schemas/nav-item"

/**
 * FooterNav is currently identical to MainNav, but I am keeping them separate
 * in case I want to add different functionality to the footer nav in the future.
 */
export function FooterNav({
  className,
  items,
  title,
}: {
  className?: string
  items: NavItem[]
  title?: string
}) {
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarGroup className={cn(className)}>
      {title && (
        <SidebarGroupLabel className="px-2 tracking-wider uppercase">
          {title}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon

            const isExternalLink =
              item.href.startsWith("https://") ||
              item.href.startsWith("http://")

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={item.isActive}
                  onClick={() => {
                    if (isMobile && !isExternalLink) setOpenMobile(false)
                  }}
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
                {item.extra?.render
                  ? item.extra.render
                  : isExternalLink && (
                      <SidebarMenuBadge>
                        <IconExternalLink className="size-3.5!" />
                      </SidebarMenuBadge>
                    )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
