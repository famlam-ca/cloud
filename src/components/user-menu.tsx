"use client"

import {
  IconCirclePlus,
  IconDeviceLaptop,
  IconLogout,
  IconMoon,
  IconSettings,
  IconSun,
  IconSunMoon,
  IconUser,
  IconUsers,
} from "@tabler/icons-react"
import Link from "next/link"
import { useTheme } from "next-themes"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { authClient } from "@/lib/auth/client"
import type { User } from "@/server/auth/utils"

const THEME_TOGGLE_ITEMS = [
  { icon: IconSun, label: "Light", value: "light" },
  { icon: IconMoon, label: "Dark", value: "dark" },
  { icon: IconDeviceLaptop, label: "System", value: "system" },
]

export function UserMenu({ user }: { user: User }) {
  const { theme, setTheme } = useTheme()

  async function handleSignOut() {
    await authClient.signOut()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2">
        <Avatar>
          <AvatarImage alt={user.name} src={user.image || ""} />
          <AvatarFallback>{user.name.at(0)?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="hidden flex-col items-start gap-0.5 sm:flex">
          <span className="font-medium text-sm">{user.name}</span>
          <span className="text-primary-foreground/80 text-xs capitalize">
            {user.role}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80" side="bottom">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-4 px-4 py-2.5 font-normal">
            <div className="relative">
              <Avatar size="lg">
                <AvatarImage alt={user.name} src={user.image || ""} />
                <AvatarFallback>
                  {user.name.at(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="absolute right-0 bottom-0 block size-2 rounded-full bg-green-600 ring-2 ring-card" />
            </div>
            <div className="flex flex-1 flex-col items-start">
              <span className="font-semibold text-foreground text-lg">
                {user.name}
              </span>
              <span className="text-base text-muted-foreground">
                {user.email}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <IconUser />
            <span>My account</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconSettings />
            <span>Settings</span>
          </DropdownMenuItem>
          <div className="flex select-none items-center justify-between gap-2 px-3 py-2">
            <div className="flex flex-1 items-center gap-2">
              <IconSunMoon className="size-4" />
              <span>Theme</span>
            </div>
            <ToggleGroup className="overflow-hidden rounded-full bg-primary/10 p-0.5">
              {THEME_TOGGLE_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <ToggleGroupItem
                    aria-label={`Toggle ${item.label}`}
                    className="relative inline-flex size-6 min-w-6 cursor-pointer items-center justify-center whitespace-nowrap px-0! outline-none hover:bg-transparent focus-visible:ring-[3px] data-pressed:bg-transparent! [&_svg]:pointer-events-none [&_svg]:shrink-0"
                    data-pressed={item.value === theme}
                    key={item.value}
                    onClick={() => setTheme(item.value)}
                    value={item.value}
                  >
                    <div
                      className="flex h-full w-full items-center justify-center text-foreground **:data-[slot=active-toggle-group-item]:rounded-full! **:data-[slot=active-toggle-group-item]:bg-background"
                      data-slot="toggle-group-item-motion"
                    >
                      <span className="z-1">
                        <Icon className="size-3.5 text-primary" />
                      </span>
                      <span
                        className="absolute inset-0 z-0 rounded-md"
                        data-slot="active-toggle-group-item"
                        style={{ opacity: item.value === theme ? 1 : 0 }}
                      />
                    </div>
                  </ToggleGroupItem>
                )
              })}
            </ToggleGroup>
          </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/" />}>
            <IconUsers />
            <span>Organization</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconCirclePlus />
            <span>Add member</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10 focus:text-destructive dark:focus:bg-destructive/20 *:[svg]:text-destructive"
            onClick={handleSignOut}
          >
            <IconLogout />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
