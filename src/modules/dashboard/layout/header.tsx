"use client"

import { IconActivity } from "@tabler/icons-react"
import { PanelLeftCloseIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { UserMenu } from "@/components/user-menu"
import { APP_NAME } from "@/constants/app"
import { getDashboardWelcomeMessage } from "@/lib/utils"
import { NotificationBell } from "@/modules/notifications/ui/bell"
import type { Session } from "@/server/auth/utils"

export function DashboardHeader({ session }: { session: Session }) {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="text-primary-foreground h-(--header-height)">
      <div className="@container mx-auto flex w-full items-center justify-between gap-6 max-md:gap-1.5">
        <div className="flex items-center gap-4">
          <Button
            className="border-primary-foreground! bg-primary-foreground! text-primary!"
            onClick={toggleSidebar}
            size="icon"
          >
            <PanelLeftCloseIcon className="size-5" />
          </Button>
          <div className="hidden @sm:flex @sm:flex-col @sm:items-start">
            <p className="text-lg font-semibold">
              {getDashboardWelcomeMessage()}, {session.user.name}
            </p>
            <p className="text-primary-foreground/80">{APP_NAME} Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="icon" variant="ghost">
            <IconActivity className="size-5" />
          </Button>
          <NotificationBell />
          <UserMenu user={session.user} />
        </div>
      </div>
    </header>
  )
}
