"use client"

import { IconActivity, IconBell } from "@tabler/icons-react"
import { PanelLeftCloseIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { UserMenu } from "@/components/user-menu"
import { APP_NAME } from "@/constants/app"
import { getDashboardWelcomeMessage } from "@/lib/utils"
import type { Session } from "@/server/auth/utils"

export function DashboardHeader({ session }: { session: Session }) {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="h-(--header-height) text-primary-foreground">
      <div className="@container mx-auto flex w-full items-center justify-between gap-6 max-md:gap-1.5">
        <div className="flex items-center gap-4">
          <Button
            className="border-primary-foreground! bg-primary-foreground! text-primary!"
            onClick={toggleSidebar}
            size="icon"
          >
            <PanelLeftCloseIcon className="size-5" />
          </Button>
          <div className="@sm:flex hidden @sm:flex-col @sm:items-start">
            <p className="font-semibold text-lg">
              {getDashboardWelcomeMessage()}, {session.user.name}
            </p>
            <p className="text-primary-foreground/80">{APP_NAME} Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="icon" variant="ghost">
            <IconActivity className="size-5" />
          </Button>
          <Button className="relative" size="icon" variant="ghost">
            <IconBell className="size-5" />
            <span className="absolute top-[14%] right-[23%] size-2 rounded-full bg-destructive" />
          </Button>
          <UserMenu user={session.user} />
        </div>
      </div>
    </header>
  )
}
